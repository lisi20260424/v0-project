package queue

const (
	TaskTypeGeneration = "task:generation"
)

type GenerationPayload struct {
	TaskID  string `json:"taskId"`
	Type    string `json:"type"`
	ModelID string `json:"modelId"`
	Prompt  string `json:"prompt"`
}
