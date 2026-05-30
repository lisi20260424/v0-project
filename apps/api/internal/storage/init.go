package storage

var defaultService *Service

func Init(service *Service) {
	defaultService = service
}

func DefaultService() *Service {
	if defaultService == nil {
		defaultService = &Service{}
	}
	return defaultService
}
