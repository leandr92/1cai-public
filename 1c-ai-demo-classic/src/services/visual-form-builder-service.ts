export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'file' | 'color' | 'range' | 'button' | 'label' | 'divider' | 'container' | 'table' | 'fieldset' | 'html' | 'subform';
  placeholder?: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  validation: FieldValidation;
  defaultValue?: any;
  options?: FieldOption[];
  attributes: Record<string, any>;
  styling: FieldStyling;
  condition?: ConditionalLogic;
  description?: string;
  helpText?: string;
  position?: { x: number; y: number; z?: number };
  size?: { width: number; height: number };
  selected?: boolean;
  hovered?: boolean;
  dragging?: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidators?: CustomValidator[];
}

export interface CustomValidator {
  name: string;
  message: string;
  validatorFunction: string; // JavaScript function as string
}

export interface FieldStyling {
  width: 'full' | 'half' | 'third' | 'quarter' | 'auto';
  alignment: 'left' | 'center' | 'right';
  cssClasses: string[];
  customStyles: Record<string, string>;
}

export interface ConditionalLogic {
  dependsOn: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface FormLayout {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  styling: FormStyling;
  validation: FormValidation;
  actions: FormAction[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  title?: string;
  layout?: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
}

export interface FormStyling {
  theme: 'default' | 'minimal' | 'modern' | 'corporate' | 'custom';
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  spacing: 'compact' | 'normal' | 'relaxed';
  cssClasses: string[];
  customStyles: Record<string, string>;
}

export interface FormValidation {
  requiredFields: string[];
  customValidators: CustomValidator[];
  crossFieldValidation: CrossFieldValidator[];
  validationOnSubmit: boolean;
  validationOnInput: boolean;
}

export interface CrossFieldValidator {
  id: string;
  name: string;
  fields: string[];
  validatorFunction: string;
  message: string;
}

export interface FormAction {
  id: string;
  type: 'submit' | 'reset' | 'custom';
  label: string;
  style: 'primary' | 'secondary' | 'danger' | 'ghost';
  validation: boolean;
  confirmation?: {
    enabled: boolean;
    title: string;
    message: string;
  };
  customAction?: string; // JavaScript function name
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors?: ValidationError[];
  metadata: {
    userAgent: string;
    ipAddress?: string;
    userId?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'contact' | 'registration' | 'survey' | 'application' | 'feedback' | 'custom';
  thumbnail?: string;
  fields: Omit<FormField, 'id' | 'name'>[];
  createdAt: Date;
  usageCount: number;
}

export class VisualFormBuilderService {
  private forms: Map<string, FormLayout> = new Map();
  private templates: FormTemplate[] = [];
  private submissions: Map<string, FormSubmission> = new Map();
  private draftAutoSave: boolean = true;
  private maxDrafts: number = 10;
  private currentForm: FormLayout | null = null;

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'contact-form',
        name: 'Контактная форма',
        description: 'Стандартная форма для сбора контактных данных',
        category: 'contact',
        fields: [
          {
            label: 'Имя',
            type: 'text',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 2, maxLength: 50 },
            defaultValue: '',
            attributes: { autocomplete: 'given-name' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Фамилия',
            type: 'text',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 2, maxLength: 50 },
            defaultValue: '',
            attributes: { autocomplete: 'family-name' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Email',
            type: 'email',
            required: true,
            disabled: false,
            readonly: false,
            validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
            defaultValue: '',
            attributes: { autocomplete: 'email' },
            styling: { width: 'full', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Телефон',
            type: 'tel',
            required: false,
            disabled: false,
            readonly: false,
            validation: { pattern: '^\\+?[1-9]\\d{1,14}$' },
            defaultValue: '',
            attributes: { autocomplete: 'tel' },
            styling: { width: 'full', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Сообщение',
            type: 'textarea',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 10, maxLength: 1000 },
            defaultValue: '',
            attributes: { rows: 5 },
            styling: { width: 'full', alignment: 'left', cssClasses: [], customStyles: {} }
          }
        ],
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: 'registration-form',
        name: 'Форма регистрации',
        description: 'Форма для регистрации новых пользователей',
        category: 'registration',
        fields: [
          {
            label: 'Логин',
            type: 'text',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' },
            defaultValue: '',
            attributes: { autocomplete: 'username' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Email',
            type: 'email',
            required: true,
            disabled: false,
            readonly: false,
            validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
            defaultValue: '',
            attributes: { autocomplete: 'email' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Пароль',
            type: 'password',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 8 },
            defaultValue: '',
            attributes: { autocomplete: 'new-password' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Подтверждение пароля',
            type: 'password',
            required: true,
            disabled: false,
            readonly: false,
            validation: { minLength: 8 },
            defaultValue: '',
            attributes: { autocomplete: 'new-password' },
            styling: { width: 'half', alignment: 'left', cssClasses: [], customStyles: {} }
          },
          {
            label: 'Соглашаюсь с условиями',
            type: 'checkbox',
            required: true,
            disabled: false,
            readonly: false,
            validation: {},
            defaultValue: false,
            styling: { width: 'full', alignment: 'left', cssClasses: [], customStyles: {} }
          }
        ],
        createdAt: new Date(),
        usageCount: 0
      }
    ];
  }

  async createForm(
    name: string,
    description?: string,
    fields?: Omit<FormField, 'id'>[]
  ): Promise<FormLayout | null> {
    const formId = this.generateFormId();
    
    if (!fields || fields.length === 0) {
      // Если поля не переданы, создаем пустую форму
      const form: FormLayout = {
        id: formId,
        name: name || 'Новая форма',
        description: description || '',
        fields: [],
        styling: {
          theme: 'default',
          primaryColor: '#1976d2',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: 14,
          borderRadius: 4,
          spacing: 'normal',
          cssClasses: [],
          customStyles: {}
        },
        validation: {
          requiredFields: [],
          customValidators: [],
          crossFieldValidation: [],
          validationOnSubmit: true,
          validationOnInput: false
        },
        actions: [
          {
            id: this.generateActionId(),
            type: 'submit',
            label: 'Отправить',
            style: 'primary',
            validation: true,
            confirmation: {
              enabled: false,
              title: 'Подтверждение',
              message: 'Вы уверены, что хотите отправить форму?'
            }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        title: name || 'Новая форма',
        layout: {
          width: 1200,
          height: 800,
          backgroundColor: '#ffffff'
        }
      };
      
      this.forms.set(formId, form);
      this.currentForm = form;
      return form;
    }

    const formFields: FormField[] = fields.map(field => ({
      ...field,
      id: this.generateFieldId(),
      name: field.name || this.generateFieldName(field.label),
      position: field.position || { x: 0, y: 0, z: 1 },
      size: field.size || { width: 200, height: 40 }
    }));

    const form: FormLayout = {
      id: formId,
      name,
      description: description || '',
      fields: formFields,
      styling: {
        theme: 'default',
        primaryColor: '#1976d2',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        borderRadius: 4,
        spacing: 'normal',
        cssClasses: [],
        customStyles: {}
      },
      validation: {
        requiredFields: formFields.filter(f => f.required).map(f => f.id),
        customValidators: [],
        crossFieldValidation: [],
        validationOnSubmit: true,
        validationOnInput: false
      },
      actions: [
        {
          id: this.generateActionId(),
          type: 'submit',
          label: 'Отправить',
          style: 'primary',
          validation: true,
          confirmation: {
            enabled: false,
            title: 'Подтверждение',
            message: 'Вы уверены, что хотите отправить форму?'
          }
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      title: name || 'Новая форма',
      layout: {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff'
      }
    };

    this.forms.set(formId, form);
    this.currentForm = form;
    return form;
  }

  async updateForm(
    formId: string,
    updates: Partial<Omit<FormLayout, 'id' | 'createdAt'>>
  ): Promise<FormLayout> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date(),
      version: this.incrementVersion(form.version)
    };

    this.forms.set(formId, updatedForm);
    return updatedForm;
  }

  async addField(formId: string, field: Omit<FormField, 'id'>): Promise<FormField> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const newField: FormField = {
      ...field,
      id: this.generateFieldId(),
      name: field.name || this.generateFieldName(field.label)
    };

    form.fields.push(newField);
    form.updatedAt = new Date();

    return newField;
  }

  async updateField(formId: string, fieldId: string, updates: Partial<FormField>): Promise<FormField> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const fieldIndex = form.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      throw new Error(`Field with id ${fieldId} not found in form ${formId}`);
    }

    const updatedField = {
      ...form.fields[fieldIndex],
      ...updates
    };

    form.fields[fieldIndex] = updatedField;
    form.updatedAt = new Date();

    return updatedField;
  }

  async removeField(formId: string, fieldId: string): Promise<boolean> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const initialLength = form.fields.length;
    form.fields = form.fields.filter(f => f.id !== fieldId);
    form.updatedAt = new Date();

    return form.fields.length < initialLength;
  }

  async duplicateField(formId: string, fieldId: string): Promise<FormField> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const originalField = form.fields.find(f => f.id === fieldId);
    if (!originalField) {
      throw new Error(`Field with id ${fieldId} not found`);
    }

    const duplicatedField: FormField = {
      ...originalField,
      id: this.generateFieldId(),
      name: this.generateFieldName(originalField.label),
      label: `${originalField.label} (копия)`
    };

    form.fields.push(duplicatedField);
    form.updatedAt = new Date();

    return duplicatedField;
  }

  async reorderFields(formId: string, fieldIds: string[]): Promise<FormField[]> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const reorderedFields: FormField[] = [];
    
    fieldIds.forEach(fieldId => {
      const field = form.fields.find(f => f.id === fieldId);
      if (field) {
        reorderedFields.push(field);
      }
    });

    // Add any fields that weren't in the reorder list
    form.fields.forEach(field => {
      if (!fieldIds.includes(field.id)) {
        reorderedFields.push(field);
      }
    });

    form.fields = reorderedFields;
    form.updatedAt = new Date();

    return reorderedFields;
  }

  async submitForm(formId: string, data: Record<string, any>, metadata?: any): Promise<FormSubmission> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    // Validate form data
    const validationErrors = this.validateFormData(form, data);
    
    const submission: FormSubmission = {
      id: this.generateSubmissionId(),
      formId,
      data,
      submittedAt: new Date(),
      status: validationErrors.length > 0 ? 'failed' : 'completed',
      errors: validationErrors,
      metadata: {
        userAgent: metadata?.userAgent || 'Unknown',
        ipAddress: metadata?.ipAddress,
        userId: metadata?.userId,
        ...metadata
      }
    };

    this.submissions.set(submission.id, submission);
    return submission;
  }

  private validateFormData(form: FormLayout, data: Record<string, any>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Field-level validation
    form.fields.forEach(field => {
      const value = data[field.name];

      // Required field check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label} является обязательным`,
          code: 'required'
        });
        return;
      }

      // Skip validation for empty non-required fields
      if (!field.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validation
      const typeValidation = this.validateFieldByType(field, value);
      errors.push(...typeValidation);
    });

    // Cross-field validation
    form.validation.crossFieldValidation.forEach(validator => {
      const crossFieldError = this.validateCrossField(form, validator, data);
      if (crossFieldError) {
        errors.push(crossFieldError);
      }
    });

    return errors;
  }

  private validateFieldByType(field: FormField, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field.type) {
      case 'email':
        if (!field.validation.pattern || !new RegExp(field.validation.pattern).test(value)) {
          errors.push({
            field: field.name,
            message: 'Некорректный формат email',
            code: 'email'
          });
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          errors.push({
            field: field.name,
            message: 'Значение должно быть числом',
            code: 'number'
          });
        } else {
          if (field.validation.min !== undefined && Number(value) < field.validation.min) {
            errors.push({
              field: field.name,
              message: `Значение должно быть не меньше ${field.validation.min}`,
              code: 'min'
            });
          }
          if (field.validation.max !== undefined && Number(value) > field.validation.max) {
            errors.push({
              field: field.name,
              message: `Значение должно быть не больше ${field.validation.max}`,
              code: 'max'
            });
          }
        }
        break;

      case 'text':
      case 'textarea':
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors.push({
            field: field.name,
            message: `Текст должен содержать минимум ${field.validation.minLength} символов`,
            code: 'minLength'
          });
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors.push({
            field: field.name,
            message: `Текст должен содержать максимум ${field.validation.maxLength} символов`,
            code: 'maxLength'
          });
        }
        break;

      case 'checkbox':
        if (field.required && !value) {
          errors.push({
            field: field.name,
            message: 'Необходимо установить флажок',
            code: 'required'
          });
        }
        break;
    }

    return errors;
  }

  private validateCrossField(
    form: FormLayout,
    validator: CrossFieldValidator,
    data: Record<string, any>
  ): ValidationError | null {
    // This would implement custom cross-field validation logic
    // For example, password confirmation validation
    const fields = validator.fields;
    
    if (fields.length === 2 && fields.includes('password') && fields.includes('confirmPassword')) {
      if (data.password !== data.confirmPassword) {
        return {
          field: 'confirmPassword',
          message: validator.message || 'Пароли не совпадают',
          code: 'password_mismatch'
        };
      }
    }

    return null;
  }

  async generateFormHTML(formId: string): Promise<string> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    let html = this.generateFormStructure(form);
    
    // Add custom styles if any
    if (Object.keys(form.styling.customStyles).length > 0) {
      html += this.generateCustomStyles(form.styling.customStyles);
    }

    return html;
  }

  private generateFormStructure(form: FormLayout): string {
    const formClass = form.styling.cssClasses.join(' ');
    const formStyle = this.generateFormStyles(form.styling);

    let html = `<form id="${form.id}" class="${formClass}" style="${formStyle}" data-form-id="${form.id}">\n`;
    
    // Form title and description
    if (form.description) {
      html += `  <p class="form-description">${form.description}</p>\n`;
    }

    // Fields
    form.fields.forEach(field => {
      html += this.generateFieldHTML(field);
    });

    // Actions
    html += `  <div class="form-actions">\n`;
    form.actions.forEach(action => {
      html += this.generateActionHTML(action);
    });
    html += `  </div>\n`;

    html += `</form>`;
    return html;
  }

  private generateFieldHTML(field: FormField): string {
    const { styling, attributes } = field;
    const style = this.generateFieldStyles(styling);
    const fieldAttributes = this.generateFieldAttributes(attributes);
    
    let html = `  <div class="form-field field-${field.type} field-${styling.width}" style="${style}">\n`;
    
    // Label
    if (field.label) {
      const requiredClass = field.required ? 'required' : '';
      html += `    <label for="${field.id}" class="field-label ${requiredClass}">${field.label}</label>\n`;
    }

    // Field based on type
    switch (field.type) {
      case 'select':
        html += this.generateSelectField(field, fieldAttributes);
        break;
      case 'textarea':
        html += this.generateTextareaField(field, fieldAttributes);
        break;
      case 'checkbox':
        html += this.generateCheckboxField(field, fieldAttributes);
        break;
      default:
        html += this.generateInputField(field, fieldAttributes);
    }

    // Help text
    if (field.helpText) {
      html += `    <small class="field-help">${field.helpText}</small>\n`;
    }

    html += `  </div>\n`;
    return html;
  }

  private generateInputField(field: FormField, attributes: string): string {
    const value = field.defaultValue || '';
    return `    <input type="${field.type}" id="${field.id}" name="${field.name}" value="${value}" ${attributes} />\n`;
  }

  private generateTextareaField(field: FormField, attributes: string): string {
    const value = field.defaultValue || '';
    const rows = field.attributes.rows || 3;
    return `    <textarea id="${field.id}" name="${field.name}" ${attributes} rows="${rows}">${value}</textarea>\n`;
  }

  private generateSelectField(field: FormField, attributes: string): string {
    let html = `    <select id="${field.id}" name="${field.name}" ${attributes}>\n`;
    
    if (field.placeholder) {
      html += `      <option value="">${field.placeholder}</option>\n`;
    }
    
    field.options?.forEach(option => {
      const disabledAttr = option.disabled ? 'disabled' : '';
      const selectedAttr = field.defaultValue === option.value ? 'selected' : '';
      html += `      <option value="${option.value}" ${disabledAttr} ${selectedAttr}>${option.label}</option>\n`;
    });
    
    html += `    </select>\n`;
    return html;
  }

  private generateCheckboxField(field: FormField, attributes: string): string {
    const checked = field.defaultValue ? 'checked' : '';
    return `    <label class="checkbox-label">\n      <input type="checkbox" id="${field.id}" name="${field.name}" ${checked} ${attributes} />\n      ${field.label}\n    </label>\n`;
  }

  private generateActionHTML(action: FormAction): string {
    const confirmationAttr = action.confirmation?.enabled ? 
      `onclick="return confirm('${action.confirmation.message}')"` : '';
    
    return `    <button type="${action.type}" class="btn btn-${action.style}" ${confirmationAttr}>${action.label}</button>\n`;
  }

  private generateFormStyles(styling: FormStyling): string {
    return `background-color: ${styling.backgroundColor}; font-family: ${styling.fontFamily}; font-size: ${styling.fontSize}px;`;
  }

  private generateFieldStyles(styling: FieldStyling): string {
    const widthStyle = styling.width === 'full' ? 'width: 100%;' : 
                      styling.width === 'half' ? 'width: 48%;' :
                      styling.width === 'third' ? 'width: 31%;' :
                      styling.width === 'quarter' ? 'width: 23%;' : 'width: auto;';
    
    const textAlign = `text-align: ${styling.alignment};`;
    const customStyles = Object.entries(styling.customStyles).map(([key, value]) => `${key}: ${value};`).join(' ');
    
    return `${widthStyle} ${textAlign} ${customStyles}`;
  }

  private generateFieldAttributes(attributes: Record<string, any>): string {
    return Object.entries(attributes)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  }

  private generateCustomStyles(customStyles: Record<string, string>): string {
    const styles = Object.entries(customStyles).map(([key, value]) => `${key}: ${value};`).join(' ');
    return `<style>${styles}</style>`;
  }

  async createFromTemplate(templateId: string, customizations: any = {}): Promise<FormLayout> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // Increment usage count
    template.usageCount++;

    const formName = customizations.name || `${template.name} - ${new Date().toLocaleDateString()}`;
    const formDescription = customizations.description || template.description;

    return this.createForm(formName, formDescription, template.fields, customizations);
  }

  // Дополнительные методы для интеграции с FormBuilder
  getCurrentForm(): FormLayout | null {
    return this.currentForm;
  }

  setCurrentForm(form: FormLayout): void {
    this.currentForm = form;
  }

  getForm(id: string): FormLayout | null {
    return this.forms.get(id) || null;
  }

  addElement(element: FormField): void {
    if (this.currentForm) {
      this.currentForm.fields.push(element);
      this.currentForm.updatedAt = new Date();
    }
  }

  moveElement(elementId: string, position: { x: number; y: number }): void {
    if (this.currentForm) {
      const element = this.currentForm.fields.find(f => f.id === elementId);
      if (element) {
        element.position = position;
        this.currentForm.updatedAt = new Date();
      }
    }
  }

  removeElement(elementId: string): void {
    if (this.currentForm) {
      this.currentForm.fields = this.currentForm.fields.filter(f => f.id !== elementId);
      this.currentForm.updatedAt = new Date();
    }
  }

  updateElement(elementId: string, updates: Partial<FormField>): void {
    if (this.currentForm) {
      const elementIndex = this.currentForm.fields.findIndex(f => f.id === elementId);
      if (elementIndex !== -1) {
        this.currentForm.fields[elementIndex] = {
          ...this.currentForm.fields[elementIndex],
          ...updates
        };
        this.currentForm.updatedAt = new Date();
      }
    }
  }

  generateId(): string {
    return this.generateFieldId();
  }

  validateForm(): { isValid: boolean; errors: any[]; warnings: any[] } {
    if (!this.currentForm) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors: any[] = [];
    const warnings: any[] = [];

    // Проверка уникальности имен полей
    const fieldNames = this.currentForm.fields.map(f => f.name);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push({
        field: 'name',
        message: 'Обнаружены дублирующиеся имена полей',
        code: 'duplicate_names'
      });
    }

    // Проверка обязательных полей
    this.currentForm.fields.forEach(field => {
      if (field.required && !field.label.trim()) {
        errors.push({
          field: field.name,
          message: 'Обязательное поле должно иметь подпись',
          code: 'required_label'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getPreview(): { html: string } | null {
    if (!this.currentForm) {
      return null;
    }

    try {
      const html = this.generateFormHTML(this.currentForm.id);
      return { html };
    } catch (error) {
      console.error('Ошибка создания предпросмотра:', error);
      return null;
    }
  }

  // Обновленный метод loadTemplate для совместимости
  loadTemplate(templateId: string): FormLayout | null {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      return null;
    }

    const formName = `${template.name} - ${new Date().toLocaleDateString()}`;
    
    // Конвертируем template fields в формат FormField
    const formFields: FormField[] = template.fields.map((fieldTemplate, index) => ({
      id: `field-${Date.now()}-${index}`,
      name: this.generateFieldName(fieldTemplate.label),
      label: fieldTemplate.label,
      type: fieldTemplate.type,
      placeholder: fieldTemplate.placeholder,
      required: fieldTemplate.required,
      disabled: fieldTemplate.disabled,
      readonly: fieldTemplate.readonly,
      validation: fieldTemplate.validation,
      defaultValue: fieldTemplate.defaultValue,
      options: fieldTemplate.options,
      attributes: fieldTemplate.attributes,
      styling: fieldTemplate.styling,
      condition: fieldTemplate.condition,
      description: fieldTemplate.description,
      helpText: fieldTemplate.helpText,
      position: { x: 20, y: 20 + index * 60, z: index + 1 },
      size: { width: 200, height: 40 },
      selected: false,
      hovered: false
    }));

    const form: FormLayout = {
      id: this.generateFormId(),
      name: formName,
      description: template.description,
      fields: formFields,
      styling: {
        theme: 'default',
        primaryColor: '#1976d2',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        borderRadius: 4,
        spacing: 'normal',
        cssClasses: [],
        customStyles: {}
      },
      validation: {
        requiredFields: formFields.filter(f => f.required).map(f => f.id),
        customValidators: [],
        crossFieldValidation: [],
        validationOnSubmit: true,
        validationOnInput: false
      },
      actions: [
        {
          id: this.generateActionId(),
          type: 'submit',
          label: 'Отправить',
          style: 'primary',
          validation: true
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      title: formName,
      layout: {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff'
      }
    };

    this.currentForm = form;
    this.forms.set(form.id, form);
    
    return form;
  }

  getAllForms(): FormLayout[] {
    return Array.from(this.forms.values());
  }

  getTemplates(): FormTemplate[] {
    return [...this.templates];
  }

  getSubmissions(formId?: string): FormSubmission[] {
    const submissions = Array.from(this.submissions.values());
    return formId ? submissions.filter(s => s.formId === formId) : submissions;
  }

  async exportForm(formId: string, format: 'json' | 'html' = 'json'): Promise<string> {
    const form = this.getForm(formId);
    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(form, null, 2);
      case 'html':
        return this.generateFormHTML(formId);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importForm(formData: string, format: 'json' | 'html' = 'json'): Promise<FormLayout> {
    switch (format) {
      case 'json':
        const parsedForm = JSON.parse(formData);
        parsedForm.id = this.generateFormId();
        parsedForm.version = '1.0';
        parsedForm.createdAt = new Date();
        parsedForm.updatedAt = new Date();
        
        this.forms.set(parsedForm.id, parsedForm);
        return parsedForm;
      
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  async deleteForm(id: string): Promise<boolean> {
    return this.forms.delete(id);
  }

  private generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubmissionId(): string {
    return `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFieldName(label: string): string {
    return label.toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const mapping: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return mapping[char] || char;
      })
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  }
}

// Export singleton instance
export const visualFormBuilderService = new VisualFormBuilderService();