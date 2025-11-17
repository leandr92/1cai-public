package com.onecai.edt.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Optional;

import org.eclipse.core.resources.IFile;
import org.eclipse.core.runtime.IPath;
import org.eclipse.core.runtime.IProgressMonitor;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Path;
import org.eclipse.core.runtime.Status;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IDocument;
import org.eclipse.jface.text.ITextSelection;
import org.eclipse.jface.text.TextSelection;
import org.eclipse.jface.text.source.IAnnotationModel;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.viewers.StructuredSelection;
import org.eclipse.ui.IEditorInput;
import org.eclipse.ui.IEditorPart;
import org.eclipse.ui.IFileEditorInput;
import org.eclipse.ui.IWorkbenchPart;
import org.eclipse.ui.IPersistableElement;
import org.eclipse.ui.texteditor.IDocumentProvider;
import org.eclipse.ui.texteditor.IElementStateListener;
import org.eclipse.ui.texteditor.ITextEditor;
import org.junit.jupiter.api.Test;

import com.onecai.edt.utils.BslSelectionHelper.BslFunctionInfo;

final class BslSelectionHelperTest {

    @Test
    void shouldResolveFromStructuredSelection() {
        FakeModule module = new FakeModule("ERP.ОбщийМодуль.OrderAnalytics");
        FakeMethod method = new FakeMethod(
            "РассчитатьДоходность",
            "Функция РассчитатьДоходность()\n    Возврат 42;\nКонецФункции",
            module
        );

        ISelection selection = new StructuredSelection(method);

        Optional<BslFunctionInfo> info = BslSelectionHelper.resolve(selection, null);

        assertTrue(info.isPresent(), "Ожидали получить информацию о функции");
        BslFunctionInfo value = info.get();
        assertEquals("ERP.ОбщийМодуль.OrderAnalytics", value.getModuleName());
        assertEquals("РассчитатьДоходность", value.getFunctionName());
        assertEquals("ERP", value.getConfiguration());
        assertNotNull(value.getFunctionBody());
        assertTrue(value.getFunctionBody().contains("Возврат 42"));
    }

    @Test
    void shouldResolveFromEditorSelection() {
        String documentText = ""
            + "&НаКлиенте\n"
            + "Процедура ОбновитьСтатус(Документ)\n"
            + "    // TODO: добавить реализацию\n"
            + "КонецПроцедуры\n";

        Document document = new Document(documentText);
        int offset = documentText.indexOf("Процедура ОбновитьСтатус");
        ITextSelection selection = new TextSelection(document, offset, 0);

        String modulePath = "ERP/ОбщийМодуль/УправлениеСтатусами.bsl";
        IWorkbenchPart editorPart = createEditorProxy(document, modulePath);

        Optional<BslFunctionInfo> info = BslSelectionHelper.resolve(selection, editorPart);

        assertTrue(info.isPresent(), "Ожидали получить данные по функции из редактора");
        BslFunctionInfo value = info.get();
        assertEquals("ERP.ОбщийМодуль.УправлениеСтатусами", value.getModuleName());
        assertEquals("ОбновитьСтатус", value.getFunctionName());
        assertEquals("ERP", value.getConfiguration());
        assertNotNull(value.getFunctionBody());
        assertTrue(value.getFunctionBody().contains("Процедура ОбновитьСтатус"));
    }

    private static IWorkbenchPart createEditorProxy(IDocument document, String projectRelativePath) {
        IDocumentProvider provider = createDocumentProvider(document);
        StubEditorInput editorInput = new StubEditorInput(projectRelativePath);

        ClassLoader loader = BslSelectionHelperTest.class.getClassLoader();
        Class<?>[] interfaces = new Class<?>[] {
            ITextEditor.class,
            IEditorPart.class,
            IWorkbenchPart.class
        };

        InvocationHandler handler = new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                String name = method.getName();
                if ("getDocumentProvider".equals(name)) {
                    return provider;
                }
                if ("getEditorInput".equals(name)) {
                    return editorInput;
                }
                if ("getAdapter".equals(name)) {
                    Class<?> adapter = (Class<?>) args[0];
                    if (adapter == ITextEditor.class || adapter == IEditorPart.class || adapter == IWorkbenchPart.class) {
                        return proxy;
                    }
                    if (adapter == IFile.class) {
                        return editorInput.getFile();
                    }
                    return null;
                }
                if ("getSite".equals(name) || "getEditorSite".equals(name)) {
                    return null;
                }
                if ("close".equals(name) || "doSave".equals(name) || "doSaveAs".equals(name) ||
                    "doRevertToSaved".equals(name) || "markAsStateDependentAction".equals(name) ||
                    "markAsSelectionDependentAction".equals(name) || "setStatusLineErrorMessage".equals(name) ||
                    "setStatusLineMessage".equals(name) || "setAction".equals(name) || "showBusy".equals(name) ||
                    "setFocus".equals(name) || "dispose".equals(name)) {
                    return null;
                }
                if ("getSelectionProvider".equals(name)) {
                    return null;
                }
                if ("isDirty".equals(name) || "isEditable".equals(name) || "isSaveAsAllowed".equals(name) ||
                    "isEditorInputModifiable".equals(name) || "isEditorInputReadOnly".equals(name) ||
                    "isShown".equals(name) || "isActivePart".equals(name)) {
                    return Boolean.FALSE;
                }
                if ("equals".equals(name)) {
                    return proxy == args[0];
                }
                if ("hashCode".equals(name)) {
                    return System.identityHashCode(proxy);
                }
                if ("toString".equals(name)) {
                    return "StubTextEditor";
                }
                return defaultValue(method.getReturnType());
            }
        };

        return (IWorkbenchPart) Proxy.newProxyInstance(loader, interfaces, handler);
    }

    private static IDocumentProvider createDocumentProvider(IDocument document) {
        ClassLoader loader = BslSelectionHelperTest.class.getClassLoader();
        return (IDocumentProvider) Proxy.newProxyInstance(
            loader,
            new Class<?>[] { IDocumentProvider.class },
            (proxy, method, args) -> {
                String name = method.getName();
                switch (name) {
                    case "getDocument":
                        return document;
                    case "connect":
                    case "disconnect":
                    case "resetDocument":
                    case "saveDocument":
                    case "setDocumentContent":
                    case "validateState":
                    case "aboutToChange":
                    case "changed":
                    case "addElementStateListener":
                    case "removeElementStateListener":
                        return null;
                    case "getAnnotationModel":
                        return null;
                    case "getModificationStamp":
                    case "getSynchronizationStamp":
                        return 0L;
                    case "canSaveDocument":
                        return Boolean.TRUE;
                    case "mustSaveDocument":
                    case "isDeleted":
                        return Boolean.FALSE;
                    case "getStatus":
                        return Status.OK_STATUS;
                    case "getOperationRunner":
                        return null;
                    default:
                        return defaultValue(method.getReturnType());
                }
            }
        );
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType == Void.TYPE) {
            return null;
        }
        if (returnType == Boolean.TYPE) {
            return Boolean.FALSE;
        }
        if (returnType == Integer.TYPE || returnType == Short.TYPE || returnType == Byte.TYPE) {
            return 0;
        }
        if (returnType == Long.TYPE) {
            return 0L;
        }
        if (returnType == Float.TYPE) {
            return 0f;
        }
        if (returnType == Double.TYPE) {
            return 0d;
        }
        if (returnType == Character.TYPE) {
            return '\0';
        }
        return null;
    }

    private static final class FakeModule {
        private final String name;

        FakeModule(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }
    }

    private static final class FakeMethod {
        private final String name;
        private final String source;
        private final FakeModule module;

        FakeMethod(String name, String source, FakeModule module) {
            this.name = name;
            this.source = source;
            this.module = module;
        }

        public String getName() {
            return name;
        }

        public String getSource() {
            return source;
        }

        public FakeModule getModule() {
            return module;
        }
    }

    private static final class StubEditorInput implements IEditorInput, IFileEditorInput {

        private final IFile file;

        StubEditorInput(String projectRelativePath) {
            this.file = createFileProxy(projectRelativePath);
        }

        @Override
        public boolean exists() {
            return true;
        }

        @Override
        public String getName() {
            return file.getName();
        }

        @Override
        public String getToolTipText() {
            return file.getFullPath().toString();
        }

        @Override
        public IPersistableElement getPersistable() {
            return null;
        }

        @Override
        public Object getAdapter(Class adapter) {
            if (adapter == IFile.class) {
                return file;
            }
            return null;
        }

        @Override
        public org.eclipse.jface.resource.ImageDescriptor getImageDescriptor() {
            return null;
        }

        @Override
        public IFile getFile() {
            return file;
        }

        @Override
        public int hashCode() {
            return file.hashCode();
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }
            if (obj instanceof StubEditorInput) {
                return file.equals(((StubEditorInput) obj).file);
            }
            return false;
        }
    }

    private static IFile createFileProxy(String projectRelativePath) {
        ClassLoader loader = BslSelectionHelperTest.class.getClassLoader();
        IPath path = new Path(projectRelativePath);
        return (IFile) Proxy.newProxyInstance(
            loader,
            new Class<?>[] { IFile.class },
            new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    String name = method.getName();
                    switch (name) {
                        case "getProjectRelativePath":
                        case "getFullPath":
                            return path;
                        case "getName":
                            return path.lastSegment();
                        case "exists":
                        case "isAccessible":
                            return Boolean.TRUE;
                        case "getAdapter":
                            return null;
                        case "hashCode":
                            return path.hashCode();
                        case "equals":
                            if (args != null && args.length == 1 && args[0] instanceof IFile) {
                                return path.equals(((IFile) args[0]).getFullPath());
                            }
                            return Boolean.FALSE;
                        case "toString":
                            return path.toString();
                        default:
                            return defaultValue(method.getReturnType());
                    }
                }
            }
        );
    }
}

