/**
 * Визуальный конструктор форм для 1С
 * Компонент с drag-and-drop интерфейсом для создания форм
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MousePointer2, 
  Move, 
  Square, 
  Type, 
  CheckSquare, 
  Radio, 
  ChevronDown, 
  Table, 
  Grid3X3, 
  Tag, 
  Minus, 
  FolderTree, 
  BarChart3, 
  Box,
  Eye,
  Download,
  Save,
  Upload,
  RefreshCw,
  Copy,
  Trash2,
  Settings,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Palette,
  Layers,
  Undo,
  Redo,
  Plus,
  GripVertical,
  Lock,
  Unlock,
  EyeOff
} from 'lucide-react';

import { 
  visualFormBuilderService,
  FormField,
  FormTemplate
} from '../../services/visual-form-builder-service';
import {
  FormElementType,
  FormElement,
  CanvasElement,
  FormSchema,
  FormPreview,
  FormValidationResult,
  ValidationError,
  ValidationWarning,
  DragState,
  ResizeState,
  ToolboxItem,
  FormBuilderProps,
  ELEMENT_TYPE_LABELS,
  ELEMENT_CATEGORIES,
  convertFormElementToField,
  convertFormSchemaToLayout
} from '../../types/form-builder.types';

// =============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КОНВЕРТАЦИИ ТИПОВ
// =============================================================================

/**
 * Приводит тип элемента к FormElementType с валидацией
 */
const validateElementType = (type: FormElementType | string): FormElementType => {
  const validTypes: FormElementType[] = [
    'text', 'textarea', 'number', 'email', 'password', 'tel', 'url',
    'date', 'time', 'datetime-local', 'checkbox', 'radio', 'select',
    'file', 'color', 'range', 'button', 'label', 'divider',
    'container', 'table', 'fieldset', 'html', 'subform'
  ];
  
  if (validTypes.includes(type as FormElementType)) {
    return type as FormElementType;
  }
  
  // Если тип невалидный, возвращаем 'text' как дефолтное значение
  console.warn(`Invalid element type: ${type}, defaulting to 'text'`);
  return 'text';
};

/**
 * Конвертирует CanvasElement в FormElement
 */
const canvasElementToFormElement = (canvasElement: CanvasElement): FormElement => {
  // Валидация и приведение типа
  const validatedType = validateElementType(canvasElement.type);
  
  const formElement: FormElement = {
    id: canvasElement.id,
    name: canvasElement.name,
    type: validatedType,
    label: canvasElement.label || ELEMENT_TYPE_LABELS[validatedType],
    position: canvasElement.position,
    size: canvasElement.size,
    properties: canvasElement.properties || {},
    validation: canvasElement.validation || {},
    styling: canvasElement.styling || {},
    selected: false,
    hovered: false,
    dragging: false,
    resizing: false
  };

  return formElement;
};

/**
 * Конвертирует FormElement в CanvasElement
 */
const formElementToCanvasElement = (formElement: FormElement): CanvasElement => {
  const canvasElement: CanvasElement = {
    id: formElement.id,
    name: formElement.name,
    type: validateElementType(formElement.type),
    label: formElement.label,
    position: formElement.position,
    size: formElement.size,
    properties: formElement.properties || {},
    validation: formElement.validation || {},
    styling: formElement.styling || {},
    selected: false,
    hovered: false,
    dragging: false,
    resizing: false
  };

  return canvasElement;
};

/**
 * Конвертирует массив CanvasElement в массив FormElement для FormSchema
 */
const canvasElementsToFormElements = (canvasElements: CanvasElement[]): FormElement[] => {
  return canvasElements
    .filter(element => element.id && element.type) // Фильтруем валидные элементы
    .map(canvasElementToFormElement);
};

/**
 * Конвертирует массив FormElement в массив CanvasElement
 */
const formElementsToCanvasElements = (formElements: FormElement[]): CanvasElement[] => {
  return formElements
    .filter(element => element.id && element.type) // Фильтруем валидные элементы
    .map(formElementToCanvasElement);
};

/**
 * Создает валидный FormSchema из CanvasElement массива
 */
const createFormSchemaFromCanvas = (
  canvasElements: CanvasElement[], 
  formId: string = `form-${Date.now()}`,
  formName: string = 'Новая форма',
  formTitle: string = 'Новая форма'
): FormSchema => {
  const formElements = canvasElementsToFormElements(canvasElements);
  
  const formSchema: FormSchema = {
    id: formId,
    name: formName,
    title: formTitle,
    fields: formElements,
    layout: {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff'
    },
    validation: {
      rules: [],
      customValidators: []
    },
    styling: {
      theme: 'default',
      customCss: ''
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0'
  };

  return formSchema;
};

/**
 * Полное приведение любого объекта к FormSchema с валидацией
 */
const toFormSchema = (obj: any): FormSchema | null => {
  if (!obj || typeof obj !== 'object') {
    console.warn('Cannot convert to FormSchema: invalid object');
    return null;
  }

  try {
    const formSchema: FormSchema = {
      id: obj.id || `form-${Date.now()}`,
      name: obj.name || 'Безымянная форма',
      title: obj.title || obj.name || 'Новая форма',
      description: obj.description || '',
      fields: Array.isArray(obj.fields) ? obj.fields.map((field: any) => ({
        ...field,
        type: validateElementType(field.type),
        label: field.label || ELEMENT_TYPE_LABELS[validateElementType(field.type)]
      })) : [],
      layout: {
        width: obj.layout?.width || 1200,
        height: obj.layout?.height || 800,
        backgroundColor: obj.layout?.backgroundColor || '#ffffff'
      },
      validation: {
        rules: obj.validation?.rules || [],
        customValidators: obj.validation?.customValidators || []
      },
      styling: {
        theme: obj.styling?.theme || 'default',
        customCss: obj.styling?.customCss || ''
      },
      createdAt: obj.createdAt || new Date(),
      updatedAt: new Date(),
      version: obj.version || '1.0'
    };

    return formSchema;
  } catch (error) {
    console.error('Error converting to FormSchema:', error);
    return null;
  }
};

// Типы теперь импортируются из '../../types/form-builder.types'

// Интерфейсы теперь импортируются из '../../types/form-builder.types'

// Toolbox конфигурация
const TOOLBOX_ITEMS: ToolboxItem[] = [
  // Ввод данных
  { type: 'text', label: 'Текстовое поле', icon: Type, category: 'input', description: 'Однострочное поле ввода', defaultSize: { width: 200, height: 30 } },
  { type: 'number', label: 'Числовое поле', icon: Type, category: 'input', description: 'Поле для ввода чисел', defaultSize: { width: 150, height: 30 } },
  { type: 'email', label: 'Email поле', icon: Type, category: 'input', description: 'Поле для ввода email', defaultSize: { width: 200, height: 30 } },
  { type: 'password', label: 'Поле пароля', icon: Type, category: 'input', description: 'Поле для ввода пароля', defaultSize: { width: 200, height: 30 } },
  { type: 'textarea', label: 'Многострочное поле', icon: Type, category: 'input', description: 'Многострочное поле ввода', defaultSize: { width: 300, height: 100 } },
  { type: 'checkbox', label: 'Флажок', icon: CheckSquare, category: 'input', description: 'Флажок для выбора', defaultSize: { width: 20, height: 20 } },
  { type: 'radio', label: 'Радиокнопка', icon: Radio, category: 'input', description: 'Радиокнопка для выбора одного варианта', defaultSize: { width: 20, height: 20 } },
  { type: 'select', label: 'Список выбора', icon: ChevronDown, category: 'input', description: 'Выпадающий список', defaultSize: { width: 150, height: 30 } },
  { type: 'date', label: 'Поле даты', icon: Type, category: 'input', description: 'Поле для выбора даты', defaultSize: { width: 150, height: 30 } },
  { type: 'time', label: 'Поле времени', icon: Type, category: 'input', description: 'Поле для выбора времени', defaultSize: { width: 150, height: 30 } },
  { type: 'file', label: 'Поле файла', icon: Upload, category: 'input', description: 'Поле для загрузки файлов', defaultSize: { width: 200, height: 30 } },

  // Контролы
  { type: 'button', label: 'Кнопка', icon: Square, category: 'controls', description: 'Кнопка для действий', defaultSize: { width: 100, height: 35 } },

  // Контейнеры
  { type: 'table', label: 'Таблица', icon: Table, category: 'containers', description: 'Таблица для отображения данных', defaultSize: { width: 400, height: 300 } },
  { type: 'container', label: 'Контейнер', icon: Grid3X3, category: 'containers', description: 'Контейнер для группировки элементов', defaultSize: { width: 300, height: 200 } },

  // Дисплей
  { type: 'label', label: 'Подпись', icon: Tag, category: 'display', description: 'Текстовая подпись', defaultSize: { width: 100, height: 20 } },
  { type: 'divider', label: 'Разделитель', icon: Minus, category: 'display', description: 'Горизонтальная линия-разделитель', defaultSize: { width: 200, height: 2 } },

  // Специальные
  { type: 'fieldset', label: 'Поле набора данных', icon: Grid3X3, category: 'special', description: 'Поле для работы с данными', defaultSize: { width: 200, height: 100 } },
  { type: 'html', label: 'HTML элемент', icon: Box, category: 'special', description: 'Произвольный HTML контент', defaultSize: { width: 200, height: 100 } },
  { type: 'subform', label: 'Вложенная форма', icon: FolderTree, category: 'special', description: 'Ссылка на другую форму', defaultSize: { width: 300, height: 200 } },
];

// Константы теперь импортируются из '../../types/form-builder.types'

const FormBuilder: React.FC<FormBuilderProps> = ({
  width = 1200,
  height = 800,
  onFormChange,
  onElementSelect,
  onPreview,
  onExport,
  readonly = false,
  showRulers = true,
  showGrid = true,
  snapToGrid = true,
  gridSize = 10
}) => {
  // Состояние основных данных
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [toolboxCategory, setToolboxCategory] = useState<string>('input');

  // Состояние UI
  const [showProperties, setShowProperties] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Состояние перетаскивания
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    offset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 }
  });

  // Состояние изменения размера
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizedElement: null,
    direction: '',
    startSize: { width: 0, height: 0 },
    startPosition: { x: 0, y: 0 }
  });

  // Рефы
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Мемоизированные значения
  const toolboxCategories = useMemo(() => Object.entries(ELEMENT_CATEGORIES), []);
  const filteredToolboxItems = useMemo(() => 
    TOOLBOX_ITEMS.filter(item => item.category === toolboxCategory),
    [toolboxCategory]
  );

  // Валидация формы
  const [validationResult, setValidationResult] = useState<FormValidationResult | null>(null);

  /**
   * Инициализация новой формы
   */
  const initializeForm = useCallback(async () => {
    try {
      const form = await visualFormBuilderService.createForm('Новая форма');
      if (form) {
        // Полное приведение к FormSchema
        const validFormSchema = toFormSchema(form);
        setCurrentForm(validFormSchema);
        setElements([]);
        setSelectedElement(null);
        setValidationResult(null);
      }
    } catch (error) {
      console.error('Ошибка инициализации формы:', error);
    }
  }, []);

  /**
   * Загрузка шаблона
   */
  const loadTemplate = useCallback((template: FormTemplate) => {
    const form = visualFormBuilderService.loadTemplate(template.id);
    if (form) {
      // Полное приведение к FormSchema
      const validForm = toFormSchema(form);
      if (validForm) {
        setCurrentForm(validForm);
        // Конвертируем FormElement[] в CanvasElement[]
        const canvasElements = formElementsToCanvasElements(validForm.fields);
        setElements(canvasElements);
        setSelectedElement(null);
        setValidationResult(null);
      }
    }
  }, []);

  /**
   * Обработка создания нового элемента
   */
  const handleCreateElement = useCallback((type: FormElementType, item: ToolboxItem) => {
    if (readonly) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const centerX = canvasRect.width / 2 - item.defaultSize.width / 2;
    const centerY = canvasRect.height / 2 - item.defaultSize.height / 2;

    // Создаем CanvasElement с полной типизацией
    const newCanvasElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: validateElementType(type),
      name: `${type}-${Date.now()}`,
      label: ELEMENT_TYPE_LABELS[validateElementType(type)],
      position: {
        x: Math.max(0, Math.round(centerX / gridSize) * gridSize),
        y: Math.max(0, Math.round(centerY / gridSize) * gridSize),
        z: elements.length + 1
      },
      size: { ...item.defaultSize },
      properties: getDefaultProperties(type),
      validation: getDefaultValidation(type),
      selected: true,
      hovered: false,
      dragging: false,
      resizing: false
    };

    // Привязка к сетке если включена
    if (snapToGrid) {
      newCanvasElement.position.x = Math.round(newCanvasElement.position.x / gridSize) * gridSize;
      newCanvasElement.position.y = Math.round(newCanvasElement.position.y / gridSize) * gridSize;
      newCanvasElement.size.width = Math.round(newCanvasElement.size.width / gridSize) * gridSize;
      newCanvasElement.size.height = Math.round(newCanvasElement.size.height / gridSize) * gridSize;
    }

    // Обновляем состояние элементов
    setElements(prev => [...prev, newCanvasElement]);
    setSelectedElement(newCanvasElement);

    // Уведомление об изменении
    if (onFormChange && currentForm) {
      // Создаем FormSchema с полной конвертацией типов
      const updatedCanvasElements = [...elements, newCanvasElement];
      const updatedFormSchema = createFormSchemaFromCanvas(
        updatedCanvasElements,
        currentForm.id,
        currentForm.name,
        currentForm.title
      );
      onFormChange(updatedFormSchema);
    }
  }, [readonly, elements, currentForm, onFormChange, snapToGrid, gridSize]);

  /**
   * Обработка выбора элемента
   */
  const handleElementSelect = useCallback((element: CanvasElement, event: React.MouseEvent) => {
    if (readonly) return;

    event.stopPropagation();
    
    // Обновляем состояние выбора
    setElements(prev => prev.map(el => ({
      ...el,
      selected: el.id === element.id
    })));
    
    setSelectedElement(element);
    
    // Конвертируем CanvasElement в FormElement для обратного вызова
    const formElement = canvasElementToFormElement(element);
    onElementSelect?.(formElement);

    // Начинаем перетаскивание если элемент уже выбран
    if (element.selected) {
      setDragState({
        isDragging: true,
        draggedElement: element,
        offset: { 
          x: event.clientX - element.position.x, 
          y: event.clientY - element.position.y 
        },
        startPosition: { ...element.position }
      });
    }
  }, [readonly, onElementSelect]);

  /**
   * Обработка начала перетаскивания
   */
  const handleDragStart = useCallback((element: CanvasElement, event: React.MouseEvent) => {
    if (readonly) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      draggedElement: element,
      offset: { 
        x: event.clientX - element.position.x, 
        y: event.clientY - element.position.y 
      },
      startPosition: { ...element.position }
    });

    setElements(prev => prev.map(el => ({
      ...el,
      dragging: el.id === element.id
    })));
  }, [readonly]);

  /**
   * Обработка перетаскивания
   */
  const handleDrag = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedElement || readonly) return;

    event.preventDefault();

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newX = Math.max(0, event.clientX - canvasRect.left - dragState.offset.x);
    const newY = Math.max(0, event.clientY - canvasRect.top - dragState.offset.y);

    let finalX = newX;
    let finalY = newY;

    // Привязка к сетке
    if (snapToGrid) {
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }

    const updatedPosition = { x: finalX, y: finalY };

    visualFormBuilderService.moveElement(dragState.draggedElement.id, updatedPosition);

    setElements(prev => prev.map(el => 
      el.id === dragState.draggedElement!.id 
        ? { ...el, position: updatedPosition }
        : el
    ));

    // Обновляем выбранный элемент
    if (selectedElement?.id === dragState.draggedElement.id) {
      setSelectedElement(prev => prev ? { ...prev, position: updatedPosition } : null);
    }
  }, [dragState, readonly, snapToGrid, gridSize, selectedElement]);

  /**
   * Обработка окончания перетаскивания
   */
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || readonly) return;

    setDragState({
      isDragging: false,
      draggedElement: null,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 }
    });

    setElements(prev => prev.map(el => ({
      ...el,
      dragging: false
    })));

    // Уведомление об изменении
    if (onFormChange && currentForm) {
      const updatedElements = elements.map(el => 
        el.dragging ? { ...el, dragging: false } : el
      );
      // Создаем обновленный FormSchema с полной конвертацией типов
      const updatedFormSchema = createFormSchemaFromCanvas(
        updatedElements,
        currentForm.id,
        currentForm.name,
        currentForm.title
      );
      onFormChange(updatedFormSchema);
    }
  }, [dragState, readonly, elements, currentForm, onFormChange]);

  /**
   * Обработка изменения размера
   */
  const handleResize = useCallback((element: CanvasElement, direction: string, event: React.MouseEvent) => {
    if (readonly) return;

    event.preventDefault();
    event.stopPropagation();

    setResizeState({
      isResizing: true,
      resizedElement: element,
      direction,
      startSize: { ...element.size },
      startPosition: { ...element.position }
    });
  }, [readonly]);

  /**
   * Обработка удаления элемента
   */
  const handleDeleteElement = useCallback((elementId: string) => {
    if (readonly) return;

    setElements(prev => prev.filter(el => el.id !== elementId));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
      onElementSelect?.(null);
    }

    // Уведомление об изменении
    if (onFormChange && currentForm) {
      const updatedCanvasElements = elements.filter(el => el.id !== elementId);
      // Создаем обновленный FormSchema с полной конвертацией типов
      const updatedFormSchema = createFormSchemaFromCanvas(
        updatedCanvasElements,
        currentForm.id,
        currentForm.name,
        currentForm.title
      );
      onFormChange(updatedFormSchema);
    }
  }, [readonly, selectedElement, elements, currentForm, onFormChange]);

  /**
   * Обработка дублирования элемента
   */
  const handleDuplicateElement = useCallback((element: CanvasElement) => {
    if (readonly) return;

    const duplicatedElement: CanvasElement = {
      ...element,
      id: `duplicate-${Date.now()}`,
      name: `${element.name}-copy`,
      type: validateElementType(element.type),
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20,
        z: elements.length + 1
      },
      selected: true,
      hovered: false,
      dragging: false,
      resizing: false
    };

    // Приводим к FormElement для visualFormBuilderService
    const formElement = canvasElementToFormElement(duplicatedElement);
    
    // Используем правильный интерфейс для добавления элемента
    try {
      const field = convertFormElementToField(formElement);
      // Исправляем несовместимые типы
      visualFormBuilderService.addElement({
        ...field,
        styling: {
          ...field.styling,
          width: 'full' as const // Принудительно устанавливаем допустимый тип
        }
      } as any);
    } catch (error) {
      console.warn('Failed to add element to service:', error);
    }
    
    setElements(prev => [...prev, duplicatedElement]);
    setSelectedElement(duplicatedElement);
  }, [readonly, elements.length]);

  /**
   * Валидация формы
   */
  const handleValidateForm = useCallback(() => {
    const result = visualFormBuilderService.validateForm();
    setValidationResult(result);
  }, []);

  /**
   * Предпросмотр формы
   */
  const handlePreview = useCallback(() => {
    try {
      const servicePreview = visualFormBuilderService.getPreview();
      if (servicePreview && typeof servicePreview === 'object' && 'html' in servicePreview) {
        // Создаем полный FormPreview из результата сервиса
        const formSchema = currentForm || createFormSchemaFromCanvas(elements);
        const formPreview: FormPreview = {
          form: formSchema,
          elements: canvasElementsToFormElements(elements),
          selectedElement: selectedElement ? canvasElementToFormElement(selectedElement) : null,
          isValid: true,
          errors: [],
          html: (servicePreview as any).html || '<div>Предпросмотр недоступен</div>'
        };
        onPreview?.(formPreview);
        setShowPreview(true);
      } else {
        // Создаем базовый preview если сервис не вернул данных
        const formSchema = currentForm || createFormSchemaFromCanvas(elements);
        const basicPreview: FormPreview = {
          form: formSchema,
          elements: canvasElementsToFormElements(elements),
          selectedElement: selectedElement ? canvasElementToFormElement(selectedElement) : null,
          isValid: true,
          errors: [],
          html: '<div>Предпросмотр недоступен</div>'
        };
        onPreview?.(basicPreview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Ошибка создания предпросмотра:', error);
      // Создаем fallback preview в случае ошибки
      const formSchema = currentForm || createFormSchemaFromCanvas(elements);
      const errorPreview: FormPreview = {
        form: formSchema,
        elements: canvasElementsToFormElements(elements),
        selectedElement: selectedElement ? canvasElementToFormElement(selectedElement) : null,
        isValid: false,
        errors: ['Ошибка генерации предпросмотра'],
        html: '<div>Ошибка загрузки предпросмотра</div>'
      };
      onPreview?.(errorPreview);
      setShowPreview(true);
    }
  }, [onPreview, currentForm, elements, selectedElement]);

  /**
   * Экспорт формы
   */
  const handleExport = useCallback((format: 'json' | 'xml' | 'html') => {
    try {
      onExport?.(format);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  }, [onExport]);

  /**
   * Обработка клика по canvas (отмена выбора)
   */
  const handleCanvasClick = useCallback(() => {
    if (readonly) return;

    setElements(prev => prev.map(el => ({ ...el, selected: false })));
    setSelectedElement(null);
    onElementSelect?.(null);
  }, [readonly, onElementSelect]);

  /**
   * Обработка клавиатуры
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (readonly) return;

    // Удаление элемента
    if (event.key === 'Delete' && selectedElement) {
      handleDeleteElement(selectedElement.id);
    }
    
    // Дублирование элемента
    if ((event.ctrlKey || event.metaKey) && event.key === 'd' && selectedElement) {
      event.preventDefault();
      handleDuplicateElement(selectedElement);
    }
    
    // Навигация по элементам
    if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      
      const delta = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }
      }[event.key];

      if (!delta) return;

      const moveDelta = event.shiftKey ? gridSize : 1;
      const newPosition = {
        x: selectedElement.position.x + delta.x * moveDelta,
        y: selectedElement.position.y + delta.y * moveDelta
      };

      if (snapToGrid) {
        newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
        newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
      }

      visualFormBuilderService.moveElement(selectedElement.id, newPosition);
      const updatedElement = { ...selectedElement, position: newPosition };
      setSelectedElement(updatedElement);
      setElements(prev => prev.map(el => 
        el.id === selectedElement.id ? { ...el, position: newPosition } : el
      ));
      
      // Уведомление об изменении
      if (onFormChange && currentForm) {
        const updatedElements = elements.map(el => 
          el.id === selectedElement.id ? { ...el, position: newPosition } : el
        );
        const updatedFormSchema = createFormSchemaFromCanvas(
          updatedElements,
          currentForm.id,
          currentForm.name,
          currentForm.title
        );
        onFormChange(updatedFormSchema);
      }
    }
  }, [readonly, selectedElement, handleDeleteElement, handleDuplicateElement, gridSize, snapToGrid]);

  // Подключение обработчиков событий
  useEffect(() => {
    if (!readonly) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, readonly]);

  // Отслеживание изменений в форме
  useEffect(() => {
    const currentFormState = visualFormBuilderService.getCurrentForm();
    if (currentFormState) {
      // Полное приведение к FormSchema
      const validFormSchema = toFormSchema(currentFormState);
      if (validFormSchema) {
        setCurrentForm(validFormSchema);
        // Конвертируем FormElement[] в CanvasElement[]
        const canvasElements = formElementsToCanvasElements(validFormSchema.fields);
        setElements(canvasElements);
      }
    }
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  /**
   * Получение стандартных свойств для типа элемента
   */
  function getDefaultProperties(type: FormElementType): Record<string, any> {
    const validatedType = validateElementType(type);
    const base = {
      visible: true,
      enabled: true,
      readonly: false
    };

    switch (validatedType) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
        return { ...base, inputType: validatedType, maxLength: 100, placeholder: '' };
      case 'textarea':
        return { ...base, rows: 4, maxLength: 1000, placeholder: '' };
      case 'number':
      case 'range':
        return { ...base, min: null, max: null, step: 1, placeholder: '' };
      case 'date':
      case 'time':
      case 'datetime-local':
        return { ...base, format: 'DD/MM/YYYY' };
      case 'color':
        return { ...base };
      case 'file':
        return { ...base, accept: '' };
      case 'checkbox':
      case 'radio':
        return { ...base, options: [], multiple: false };
      case 'select':
        return { ...base, options: [], multiple: false, placeholder: 'Выберите значение' };
      case 'button':
        return { ...base, buttonType: 'button', text: 'Кнопка' };
      case 'label':
        return { ...base, text: 'Подпись' };
      case 'divider':
        return { ...base };
      case 'container':
      case 'fieldset':
        return { ...base, collapsible: false };
      case 'table':
        return { ...base, columns: [], editable: true, sortable: true };
      case 'html':
        return { ...base, content: 'HTML контент' };
      case 'subform':
        return { ...base, formId: '' };
      default:
        return base;
    }
  }

  /**
   * Получение стандартной валидации для типа элемента
   */
  function getDefaultValidation(type: FormElementType): any {
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
        return { required: false, minLength: 0, maxLength: 100, pattern: '' };
      case 'textarea':
        return { required: false, minLength: 0, maxLength: 1000 };
      case 'number':
        return { required: false, min: null, max: null, step: 1 };
      case 'select':
        return { required: false };
      default:
        return { required: false };
    }
  }

  /**
   * Генерация стилей для элемента
   */
  function getElementStyle(element: CanvasElement): React.CSSProperties {
    const validatedType = validateElementType(element.type);
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      zIndex: element.position.z || 1,
      cursor: element.dragging ? 'grabbing' : (readonly ? 'default' : 'grab'),
      opacity: element.dragging ? 0.8 : 1,
      border: element.selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
      backgroundColor: element.dragging ? 'rgba(59, 130, 246, 0.1)' : 'white',
      boxSizing: 'border-box'
    };

    // Особые стили для разных типов элементов
    switch (validatedType) {
      case 'button':
        style.backgroundColor = element.selected ? '#3b82f6' : '#f3f4f6';
        style.color = element.selected ? 'white' : '#374151';
        style.border = 'none';
        style.display = 'flex';
        style.alignItems = 'center';
        style.justifyContent = 'center';
        style.fontWeight = '500';
        break;
      
      case 'checkbox':
      case 'radio':
        style.width = 'auto';
        style.height = 'auto';
        style.border = 'none';
        style.backgroundColor = 'transparent';
        break;
      
      case 'label':
        style.border = 'none';
        style.backgroundColor = 'transparent';
        style.display = 'flex';
        style.alignItems = 'center';
        style.padding = '4px';
        break;
      
      case 'divider':
        style.backgroundColor = '#d1d5db';
        style.border = 'none';
        break;
      
      case 'table':
        style.backgroundColor = '#f9fafb';
        style.border = '2px solid #3b82f6';
        break;
      
      case 'container':
      case 'fieldset':
        style.backgroundColor = '#f9fafb';
        style.border = '2px dashed #d1d5db';
        break;
      
      case 'html':
        style.backgroundColor = 'transparent';
        style.border = '1px dashed #9ca3af';
        break;
      
      case 'subform':
        style.backgroundColor = '#fef3c7';
        style.border = '2px dashed #f59e0b';
        break;
    }

    return style;
  }

  /**
   * Генерация содержимого элемента для предпросмотра
   */
  function getElementContent(element: CanvasElement): React.ReactNode {
    const validatedType = validateElementType(element.type);
    
    switch (validatedType) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'color':
      case 'range':
        return (
          <input
            type={validatedType}
            placeholder={element.properties?.placeholder || ''}
            readOnly={element.properties?.readonly || false}
            disabled={!element.properties?.enabled}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={element.properties?.placeholder || ''}
            readOnly={element.properties?.readonly || false}
            disabled={!element.properties?.enabled}
            rows={element.properties?.rows || 4}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none' }}
          />
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            disabled={!element.properties?.enabled}
            style={{ width: '100%', height: '100%' }}
          />
        );
      
      case 'radio':
        return (
          <input
            type="radio"
            disabled={!element.properties?.enabled}
            style={{ width: '100%', height: '100%' }}
          />
        );
      
      case 'select':
        return (
          <select
            disabled={!element.properties?.enabled}
            multiple={element.properties?.multiple || false}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          >
            <option value="">Выберите значение</option>
            {element.properties?.options?.map((option: any, index: number) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'file':
        return (
          <input
            type="file"
            disabled={!element.properties?.enabled}
            style={{ width: '100%', height: '100%' }}
          />
        );
      
      case 'button':
        return element.label || 'Кнопка';
      
      case 'label':
        return element.label || 'Подпись';
      
      case 'divider':
        return <div style={{ width: '100%', height: '100%', backgroundColor: '#d1d5db' }} />;
      
      case 'table':
        return (
          <div style={{ width: '100%', height: '100%', padding: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Таблица ({element.properties?.columns?.length || 0} колонок)
            </div>
            {element.properties?.columns?.slice(0, 3).map((column: any, index: number) => (
              <div key={index} style={{ 
                padding: '4px 8px', 
                border: '1px solid #e5e7eb',
                marginTop: '4px',
                fontSize: '12px'
              }}>
                {column.title}
              </div>
            ))}
          </div>
        );
      
      case 'container':
      case 'fieldset':
      case 'html':
      case 'subform':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {ELEMENT_TYPE_LABELS[validatedType]}
          </div>
        );
      
      default:
        return element.label || ELEMENT_TYPE_LABELS[validatedType] || 'Элемент';
    }
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Левая панель - Toolbox */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Заголовок панели */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Панель инструментов</h2>
          
          {/* Кнопки действий */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={initializeForm}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Новая форма"
            >
              <Plus className="w-4 h-4" />
              Новая
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              title="Шаблоны"
            >
              <Upload className="w-4 h-4" />
              Шаблоны
            </button>
          </div>

          {/* Валидация */}
          <button
            onClick={handleValidateForm}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 mb-2"
            title="Валидация формы"
          >
            <CheckSquare className="w-4 h-4" />
            Проверить
          </button>
        </div>

        {/* Категории элементов */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {toolboxCategories.map(([category, label]) => (
              <button
                key={category}
                onClick={() => setToolboxCategory(category)}
                className={`px-2 py-1 text-xs rounded ${
                  toolboxCategory === category
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Элементы toolbox */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredToolboxItems.map((item) => (
              <div
                key={item.type}
                onClick={() => handleCreateElement(item.type, item)}
                className={`
                  p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200
                  ${readonly ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-300 hover:shadow-sm'}
                `}
                title={item.description}
              >
                <div className="flex flex-col items-center text-center">
                  <item.icon className="w-8 h-8 text-gray-600 mb-2" />
                  <div className="text-xs font-medium text-gray-900">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Панель свойств */}
        {showProperties && selectedElement && (
          <div className="border-t border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Свойства элемента</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Имя</label>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => {
                    const updatedElement = { ...selectedElement, name: e.target.value };
                    setSelectedElement(updatedElement);
                    setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, name: e.target.value } : el));
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Подпись</label>
                <input
                  type="text"
                  value={selectedElement.label}
                  onChange={(e) => {
                    const updatedElement = { ...selectedElement, label: e.target.value };
                    setSelectedElement(updatedElement);
                    setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, label: e.target.value } : el));
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                  <input
                    type="number"
                    value={selectedElement.position.x}
                    onChange={(e) => {
                      const updatedElement = {
                        ...selectedElement,
                        position: { ...selectedElement.position, x: parseInt(e.target.value) || 0 }
                      };
                      setSelectedElement(updatedElement);
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, position: { ...el.position, x: parseInt(e.target.value) || 0 } } : el));
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                  <input
                    type="number"
                    value={selectedElement.position.y}
                    onChange={(e) => {
                      const updatedElement = {
                        ...selectedElement,
                        position: { ...selectedElement.position, y: parseInt(e.target.value) || 0 }
                      };
                      setSelectedElement(updatedElement);
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, position: { ...el.position, y: parseInt(e.target.value) || 0 } } : el));
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ширина</label>
                  <input
                    type="number"
                    value={selectedElement.size.width}
                    onChange={(e) => {
                      const updatedElement = {
                        ...selectedElement,
                        size: { ...selectedElement.size, width: parseInt(e.target.value) || 0 }
                      };
                      setSelectedElement(updatedElement);
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, size: { ...el.size, width: parseInt(e.target.value) || 0 } } : el));
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Высота</label>
                  <input
                    type="number"
                    value={selectedElement.size.height}
                    onChange={(e) => {
                      const updatedElement = {
                        ...selectedElement,
                        size: { ...selectedElement.size, height: parseInt(e.target.value) || 0 }
                      };
                      setSelectedElement(updatedElement);
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, size: { ...el.size, height: parseInt(e.target.value) || 0 } } : el));
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Действия с элементом */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleDuplicateElement(selectedElement)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Дублировать"
              >
                <Copy className="w-3 h-3" />
                Копировать
              </button>
              
              <button
                onClick={() => handleDeleteElement(selectedElement.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="Удалить"
              >
                <Trash2 className="w-3 h-3" />
                Удалить
              </button>
            </div>
          </div>
        )}

        {/* Результаты валидации */}
        {validationResult && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Валидация</h3>
            <div className={`text-sm ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {validationResult.isValid ? '✅ Форма корректна' : '❌ Обнаружены ошибки'}
            </div>
            {validationResult.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-700 mb-1">Ошибки:</div>
                {validationResult.errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-xs text-red-600 mb-1">
                    • {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Основная область - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Панель инструментов сверху */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentForm?.name || 'Визуальный конструктор форм'}
              </h1>
              
              {currentForm && (
                <div className="text-sm text-gray-500">
                  Элементов: {elements.length}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Управление масштабом */}
              <div className="flex items-center gap-1 border border-gray-300 rounded">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-1 hover:bg-gray-100"
                  title="Уменьшить"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-sm">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 hover:bg-gray-100"
                  title="Увеличить"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Действия */}
              <div className="flex gap-2">
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  title="Предпросмотр"
                >
                  <Eye className="w-4 h-4" />
                  Предпросмотр
                </button>

                <div className="relative">
                  <select
                    onChange={(e) => e.target.value && handleExport(e.target.value as any)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded bg-white"
                    title="Экспорт"
                  >
                    <option value="">Экспорт</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas область */}
        <div className="flex-1 relative overflow-hidden" ref={canvasWrapperRef}>
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: '0 0',
              backgroundColor: showGrid ? '#f8f9fa' : 'white'
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Сетка */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize}px ${gridSize}px`
                }}
              />
            )}

            {/* Элементы формы */}
            {elements.map((element) => (
              <div
                key={element.id}
                style={getElementStyle(element)}
                onMouseDown={(e) => handleElementSelect(element, e)}
                onMouseEnter={() => {
                  setElements(prev => prev.map(el => 
                    el.id === element.id ? { ...el, hovered: true } : el
                  ));
                }}
                onMouseLeave={() => {
                  setElements(prev => prev.map(el => 
                    el.id === element.id ? { ...el, hovered: false } : el
                  ));
                }}
                onDoubleClick={() => {
                  // Фокус на элемент для редактирования
                  setSelectedElement(element);
                  // Конвертируем CanvasElement в FormElement для обратного вызова
                  const formElement = canvasElementToFormElement(element);
                  onElementSelect?.(formElement);
                }}
                className="group select-none"
              >
                {/* Контент элемента */}
                <div className="w-full h-full flex items-center justify-center relative">
                  {getElementContent(element)}
                  
                  {/* Маркеры для изменения размера */}
                  {element.selected && !readonly && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Угловые маркеры */}
                      <div
                        className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'nw', e)}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'ne', e)}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'sw', e)}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'se', e)}
                      />
                      
                      {/* Боковые маркеры */}
                      <div
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-n-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'n', e)}
                      />
                      <div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-s-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 's', e)}
                      />
                      <div
                        className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-w-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'w', e)}
                      />
                      <div
                        className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-e-resize pointer-events-auto"
                        onMouseDown={(e) => handleResize(element, 'e', e)}
                      />
                    </div>
                  )}

                  {/* Ручка для перетаскивания */}
                  {element.selected && !readonly && (
                    <div
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-blue-500 rounded-sm cursor-grab active:cursor-grabbing flex items-center justify-center"
                      onMouseDown={(e) => handleDragStart(element, e)}
                    >
                      <GripVertical className="w-2 h-2 text-white" />
                    </div>
                  )}

                  {/* Подсказка при наведении */}
                  {element.hovered && (
                    <div className="absolute -bottom-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50">
                      {element.name} ({ELEMENT_TYPE_LABELS[validateElementType(element.type)]})
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Инструкции если нет элементов */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Plus className="w-16 h-16 mx-auto mb-4" />
                  <div className="text-lg font-medium">Начните создание формы</div>
                  <div className="text-sm">Перетащите элементы из панели слева на эту область</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Модальное окно предпросмотра */}
        {showPreview && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-4xl w-full h-full m-4 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Предпросмотр формы</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <iframe
                  srcDoc={(() => {
                    try {
                      const preview = visualFormBuilderService.getPreview();
                      return preview?.html || '<div>Предпросмотр недоступен</div>';
                    } catch (error) {
                      return '<div>Ошибка загрузки предпросмотра</div>';
                    }
                  })()}
                  className="w-full h-full border border-gray-200 rounded"
                  title="Предпросмотр формы"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;