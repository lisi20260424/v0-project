package mail

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strconv"
	"strings"
)

type Sender interface {
	SendRegisterOTP(ctx context.Context, email string, otp string) error
	SendPasswordResetOTP(ctx context.Context, email string, otp string) error
}

type LogSender struct{}

func (LogSender) SendRegisterOTP(_ context.Context, email string, otp string) error {
	log.Printf("dev register otp email=%s otp=%s", email, otp)
	return nil
}

func (LogSender) SendPasswordResetOTP(_ context.Context, email string, otp string) error {
	log.Printf("dev password reset otp email=%s otp=%s", email, otp)
	return nil
}

type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	UseTLS   bool
}

type SMTPSender struct {
	cfg SMTPConfig
}

func NewSMTPSender(cfg SMTPConfig) (*SMTPSender, error) {
	if strings.TrimSpace(cfg.Host) == "" || strings.TrimSpace(cfg.Port) == "" || strings.TrimSpace(cfg.From) == "" {
		return nil, fmt.Errorf("smtp host, port and from are required")
	}
	if _, err := strconv.Atoi(cfg.Port); err != nil {
		return nil, fmt.Errorf("invalid smtp port: %w", err)
	}
	return &SMTPSender{cfg: cfg}, nil
}

func (s *SMTPSender) SendRegisterOTP(ctx context.Context, email string, otp string) error {
	return s.send(ctx, email, "Your registration verification code", fmt.Sprintf("Your registration verification code is: %s\n\nThis code expires in 10 minutes.", otp))
}

func (s *SMTPSender) SendPasswordResetOTP(ctx context.Context, email string, otp string) error {
	return s.send(ctx, email, "Your password reset verification code", fmt.Sprintf("Your password reset verification code is: %s\n\nThis code expires in 10 minutes.", otp))
}

func (s *SMTPSender) send(ctx context.Context, to string, subject string, body string) error {
	addr := net.JoinHostPort(s.cfg.Host, s.cfg.Port)
	var auth smtp.Auth
	if s.cfg.Username != "" || s.cfg.Password != "" {
		auth = smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
	}

	msg := buildMessage(s.cfg.From, to, subject, body)
	done := make(chan error, 1)
	go func() {
		if s.cfg.UseTLS {
			done <- s.sendWithStartTLS(addr, auth, to, msg)
			return
		}
		done <- smtp.SendMail(addr, auth, s.cfg.From, []string{to}, msg)
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-done:
		return err
	}
}

func (s *SMTPSender) sendWithStartTLS(addr string, auth smtp.Auth, to string, msg []byte) error {
	client, err := smtp.Dial(addr)
	if err != nil {
		return err
	}
	defer client.Close()
	if err := client.StartTLS(&tls.Config{ServerName: s.cfg.Host, MinVersion: tls.VersionTLS12}); err != nil {
		return err
	}
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}
	if err := client.Mail(s.cfg.From); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(msg); err != nil {
		_ = w.Close()
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func buildMessage(from string, to string, subject string, body string) []byte {
	var b bytes.Buffer
	b.WriteString("From: " + from + "\r\n")
	b.WriteString("To: " + to + "\r\n")
	b.WriteString("Subject: " + subject + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("\r\n")
	b.WriteString(body)
	b.WriteString("\r\n")
	return b.Bytes()
}
