/**
 * Синхронизированные типы для визуального конструктора форм
 * Общие интерфейсы между компонентом FormBuilder и сервисом visual-form-builder
 */

// Основные типы элементов формы
export type FormElementType = 
  | 'text'
  | 'textarea' 
  | 'number'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'file'
  | 'color'
  | 'range'
  | 'button'
  | 'label'
  | 'divider'
  | 'container'
  | 'table'
  | 'fieldset'
  | 'html'
  | 'subform';

// Базовый интерфейс для всех элементов canvas
export interface CanvasElement {
  selected?: boolean;
  hovered?: boolean;
  dragging?: boolean;
  resizing?: boolean;
  id: string;
  name: string;
  type: FormElementType | string;
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number };
  properties?: Record<string, any>;
  label?: string;
  validation?: Record<string, any>;
  styling?: Record<string, any>;
}

// Элемент формы, расширяющий CanvasElement
export interface FormElement extends CanvasElement {
  type: FormElementType;
  label: string;
  name: string;
  properties: Record<string, any>;
  validation?: Record<string, any>;
  styling?: Record<string, any>;
}

// Схема формы (унифицированная между компонентом и сервисом)
export interface FormSchema {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: FormElement[];
  layout: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  validation?: {
    rules: any[];
    customValidators: any[];
  };
  styling?: {
    theme: string;
    customCss?: string;
    customStyles?: Record<string, string>;
  };
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
}

// Результат валидации формы
export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Ошибка валидации
export interface ValidationError {
  elementId?: string;
  field: string;
  message: string;
  code: string;
}

// Предупреждение валидации
export interface ValidationWarning {
  elementId?: string;
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Состояние перетаскивания
export interface DragState {
  isDragging: boolean;
  draggedElement: CanvasElement | null;
  offset: { x: number; y: number };
  startPosition: { x: number; y: number };
}

// Состояние изменения размера
export interface ResizeState {
  isResizing: boolean;
  resizedElement: CanvasElement | null;
  direction: string;
  startSize: { width: number; height: number };
  startPosition: { x: number; y: number };
}

// Элемент панели инструментов
export interface ToolboxItem {
  type: FormElementType;
  label: string;
  icon: React.ComponentType<any>;
  category: string;
  description: string;
  defaultSize: { width: number; height: number };
}

// Параметры предпросмотра формы
export interface FormPreview {
  form: FormSchema;
  elements: FormElement[];
  selectedElement: FormElement | null;
  isValid: boolean;
  errors: string[];
  html?: string;
}

// Свойства компонента FormBuilder
export interface FormBuilderProps {
  width?: number;
  height?: number;
  onFormChange?: (form: FormSchema) => void;
  onElementSelect?: (element: FormElement | null) => void;
  onPreview?: (preview: FormPreview) => void;
  onExport?: (format: 'json' | 'xml' | 'html') => void;
  readonly?: boolean;
  showRulers?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

// Конфигурация сервиса для интеграции с visual-form-builder-service
export interface ServiceIntegration {
  addElement: (element: FormElement) => void;
  moveElement: (elementId: string, position: { x: number; y: number }) => void;
  removeElement: (elementId: string) => void;
  validateForm: () => FormValidationResult;
  getCurrentForm: () => FormSchema | null;
  getPreview: () => FormPreview | null;
  createForm: (name: string, description?: string) => Promise<FormSchema | null>;
  loadTemplate: (templateId: string) => FormSchema | null;
  generateId: () => string;
}

// Маппинг типов для совместимости
export const ELEMENT_TYPE_LABELS: Record<FormElementType, string> = {
  text: 'Текстовое поле',
  textarea: 'Многострочное поле',
  number: 'Числовое поле',
  email: 'Email поле',
  password: 'Поле пароля',
  tel: 'Поле телефона',
  url: 'Поле URL',
  date: 'Поле даты',
  time: 'Поле времени',
  'datetime-local': 'Дата и время',
  checkbox: 'Флажок',
  radio: 'Радиокнопка',
  select: 'Список выбора',
  file: 'Поле файла',
  color: 'Поле цвета',
  range: 'Ползунок',
  button: 'Кнопка',
  label: 'Подпись',
  divider: 'Разделитель',
  container: 'Контейнер',
  table: 'Таблица',
  fieldset: 'Поле набора данных',
  html: 'HTML элемент',
  subform: 'Вложенная форма'
};

// Категории элементов
export const ELEMENT_CATEGORIES = {
  input: 'Ввод данных',
  controls: 'Контролы',
  containers: 'Контейнеры',
  display: 'Отображение',
  special: 'Специальные'
};

// Конвертер между FormElement и FormField (для совместимости с visual-form-builder-service)
export const convertFormElementToField = (element: FormElement) => {
  return {
    id: element.id,
    name: element.name || `${element.type}-${element.id}`,
    label: element.label,
    type: element.type as any,
    placeholder: element.properties?.placeholder,
    required: element.validation?.required || false,
    disabled: element.properties?.disabled || false,
    readonly: element.properties?.readonly || false,
    validation: {
      min: element.validation?.min,
      max: element.validation?.max,
      minLength: element.validation?.minLength,
      maxLength: element.validation?.maxLength,
      pattern: element.validation?.pattern,
      customValidators: element.validation?.customValidators || []
    },
    defaultValue: element.properties?.defaultValue,
    options: element.properties?.options || [],
    attributes: {
      ...element.properties,
      rows: element.properties?.rows,
      cols: element.properties?.cols
    },
    styling: {
      width: 'full',
      alignment: 'left' as const,
      cssClasses: element.styling?.cssClasses || [],
      customStyles: element.styling?.customStyles || {}
    },
    condition: element.properties?.condition,
    description: element.properties?.description,
    helpText: element.properties?.helpText
  };
};

// Конвертер между FormSchema и FormLayout (для совместимости с visual-form-builder-service)
export const convertFormSchemaToLayout = (schema: FormSchema) => {
  return {
    id: schema.id,
    name: schema.name,
    description: schema.description || '',
    fields: schema.fields.map(convertFormElementToField),
    styling: {
      theme: schema.styling?.theme || 'default',
      primaryColor: '#1976d2',
      backgroundColor: schema.layout?.backgroundColor || '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      borderRadius: 4,
      spacing: 'normal' as const,
      cssClasses: [],
      customStyles: schema.styling?.customStyles || {}
    },
    validation: {
      requiredFields: schema.fields.filter(f => f.validation?.required).map(f => f.id),
      customValidators: schema.validation?.customValidators || [],
      crossFieldValidation: [],
      validationOnSubmit: true,
      validationOnInput: false
    },
    actions: [],
    createdAt: schema.createdAt || new Date(),
    updatedAt: schema.updatedAt || new Date(),
    version: schema.version || '1.0'
  };
};