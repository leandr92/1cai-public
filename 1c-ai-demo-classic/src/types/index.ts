/**
 * Экспорт всех типов для визуального конструктора форм
 */

export * from './form-builder.types';

// Также экспортируем типы из сервиса для удобства
export type {
  FormField,
  FormLayout,
  FormTemplate,
  FormSubmission,
  FieldOption,
  FieldValidation,
  FieldStyling,
  FormStyling,
  FormValidation,
  FormAction,
  ValidationError,
  CrossFieldValidator,
  ConditionalLogic,
  CustomValidator
} from '../services/visual-form-builder-service';