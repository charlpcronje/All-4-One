// fx-shadcn.js
/**
 * @file fx-shadcn.js
 * @description FX ShadCN - Beautiful UI components with native FX reactivity
 */

class FXLogger {
    static log(level, message, data = {}) {
        console.log(`[FX-SHADCN:${level.toUpperCase()}]`, message, data);
    }
    static error(message, error) { this.log('error', message, { error }); }
    static warn(message, data) { this.log('warn', message, data); }
    static info(message, data) { this.log('info', message, data); }
}

/**
 * @class FXButton
 * @description Reactive button component with variants
 */
class FXButton extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            variant: props.variant || 'default',
            size: props.size || 'default',
            disabled: props.disabled || false,
            loading: props.loading || false
        };
    }

    getVariantClasses() {
        const variants = {
            default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
            destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90',
            outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
            ghost: 'hover:bg-slate-100 hover:text-slate-900',
            link: 'text-slate-900 underline-offset-4 hover:underline'
        };
        return variants[this.$$node.variant] || variants.default;
    }

    getSizeClasses() {
        const sizes = {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10'
        };
        return sizes[this.$$node.size] || sizes.default;
    }

    handleClick(e) {
        if (this.$$node.disabled || this.$$node.loading) {
            e.preventDefault();
            return;
        }
        
        if (this.props.onClick) {
            this.props.onClick(e);
        }
    }

    render() {
        const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
        const variantClasses = this.getVariantClasses();
        const sizeClasses = this.getSizeClasses();
        const className = `${baseClasses} ${variantClasses} ${sizeClasses} ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <button 
                className="${className}"
                disabled={this.$$node.disabled || this.$$node.loading}
                onClick={this.handleClick.bind(this)}
                type="${this.props.type || 'button'}"
            >
                {this.$$node.loading && (
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {this.children.length > 0 ? this.children.map(child => child.content || child).join('') : (this.props.children || 'Button')}
            </button>
        `);
    }
}

/**
 * @class FXInput
 * @description Reactive input component
 */
class FXInput extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            value: props.value || '',
            placeholder: props.placeholder || '',
            type: props.type || 'text',
            disabled: props.disabled || false,
            error: props.error || false
        };
    }

    handleInput(e) {
        const value = e.target.value;
        this.$$node.value = value;
        
        if (this.props.onInput) {
            this.props.onInput(e);
        }
        
        if (this.props.onChange) {
            this.props.onChange(e);
        }
    }

    render() {
        const baseClasses = 'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
        const errorClasses = this.$$node.error ? 'border-red-500 focus-visible:ring-red-500' : '';
        const className = `${baseClasses} ${errorClasses} ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <input 
                className="${className}"
                type="${this.$$node.type}"
                placeholder="${this.$$node.placeholder}"
                value="${this.$$node.value}"
                disabled={this.$$node.disabled}
                onInput={this.handleInput.bind(this)}
                name="${this.props.name || ''}"
                id="${this.props.id || ''}"
            />
        `);
    }
}

/**
 * @class FXCard
 * @description Card component with header, content, footer
 */
class FXCard extends FXJSXComponent {
    render() {
        const className = `rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <div className="${className}">
                ${this.children.map(child => child.content || child).join('')}
            </div>
        `);
    }
}

class FXCardHeader extends FXJSXComponent {
    render() {
        const className = `flex flex-col space-y-1.5 p-6 ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <div className="${className}">
                ${this.children.map(child => child.content || child).join('')}
            </div>
        `);
    }
}

class FXCardTitle extends FXJSXComponent {
    render() {
        const className = `text-2xl font-semibold leading-none tracking-tight ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <h3 className="${className}">
                ${this.children.map(child => child.content || child).join('')}
            </h3>
        `);
    }
}

class FXCardContent extends FXJSXComponent {
    render() {
        const className = `p-6 pt-0 ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <div className="${className}">
                ${this.children.map(child => child.content || child).join('')}
            </div>
        `);
    }
}

/**
 * @class FXDialog
 * @description Modal dialog component
 */
class FXDialog extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            open: props.open || false
        };
    }

    close() {
        this.$$node.open = false;
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            this.close();
        }
    }

    render() {
        if (!this.$$node.open) return jsx.parser.parse('<div></div>');

        return jsx.parser.parse(`
            <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <div 
                    className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
                    onClick={this.handleBackdropClick.bind(this)}
                >
                    <button 
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
                        onClick={this.close.bind(this)}
                    >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    ${this.children.map(child => child.content || child).join('')}
                </div>
            </div>
        `);
    }
}

/**
 * @class FXToast
 * @description Toast notification component
 */
class FXToast extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            visible: props.visible || false,
            variant: props.variant || 'default',
            title: props.title || '',
            description: props.description || '',
            duration: props.duration || 5000
        };
        
        // Auto-hide after duration
        if (this.$$node.visible && this.$$node.duration > 0) {
            setTimeout(() => {
                this.$$node.visible = false;
            }, this.$$node.duration);
        }
    }

    getVariantClasses() {
        const variants = {
            default: 'border-slate-200 bg-white text-slate-950',
            destructive: 'destructive border-red-500 bg-red-500 text-slate-50'
        };
        return variants[this.$$node.variant] || variants.default;
    }

    close() {
        this.$$node.visible = false;
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render() {
        if (!this.$$node.visible) return jsx.parser.parse('<div></div>');

        const variantClasses = this.getVariantClasses();
        const className = `group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all ${variantClasses}`;

        return jsx.parser.parse(`
            <div className="${className}">
                <div className="grid gap-1">
                    {this.$$node.title && (
                        <div className="text-sm font-semibold">{this.$$node.title}</div>
                    )}
                    {this.$$node.description && (
                        <div className="text-sm opacity-90">{this.$$node.description}</div>
                    )}
                </div>
                <button 
                    className="absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                    onClick={this.close.bind(this)}
                >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `);
    }
}

/**
 * @class FXSelect
 * @description Select dropdown component
 */
class FXSelect extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            value: props.value || '',
            placeholder: props.placeholder || 'Select an option...',
            open: false,
            options: props.options || []
        };
    }

    toggleOpen() {
        this.$$node.open = !this.$$node.open;
    }

    selectOption(option) {
        this.$$node.value = option.value;
        this.$$node.open = false;
        
        if (this.props.onValueChange) {
            this.props.onValueChange(option.value);
        }
    }

    getSelectedLabel() {
        const selected = this.$$node.options.find(opt => opt.value === this.$$node.value);
        return selected ? selected.label : this.$$node.placeholder;
    }

    render() {
        const triggerClasses = 'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

        return jsx.parser.parse(`
            <div className="relative">
                <button 
                    type="button"
                    className="${triggerClasses} ${this.props.className || ''}"
                    onClick={this.toggleOpen.bind(this)}
                >
                    <span>${this.getSelectedLabel()}</span>
                    <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {this.$$node.open && (
                    <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                        <div className="max-h-60 overflow-auto p-1">
                            ${this.$$node.options.map(option => `
                                <div 
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${this.$$node.value === option.value ? 'bg-slate-100' : ''}"
                                    onClick={() => this.selectOption(${JSON.stringify(option)})}
                                >
                                    {this.$$node.value === option.value && (
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    )}
                                    ${option.label}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                )}
            </div>
        `);
    }
}

/**
 * @class FXBadge
 * @description Badge component
 */
class FXBadge extends FXJSXComponent {
    constructor(props, children) {
        super(props, children);
        this.state = {
            variant: props.variant || 'default'
        };
    }

    getVariantClasses() {
        const variants = {
            default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
            destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/80',
            outline: 'text-slate-950 border border-slate-200 bg-white hover:bg-slate-100'
        };
        return variants[this.$$node.variant] || variants.default;
    }

    render() {
        const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2';
        const variantClasses = this.getVariantClasses();
        const className = `${baseClasses} ${variantClasses} ${this.props.className || ''}`;

        return jsx.parser.parse(`
            <div className="${className}">
                ${this.children.map(child => child.content || child).join('')}
            </div>
        `);
    }
}

/**
 * @class FXShadCNPlugin
 * @description Main plugin that registers all ShadCN components
 */
class FXShadCNPlugin {
    constructor(fx, options = {}) {
        $$fx = $root('fx');
        this.options = options;
        this.name = 'shadcn';
        this.version = '1.0.0';
        this.description = 'Beautiful UI components with FX reactivity';
        
        this.toastContainer = null;
        this.initializeComponents();
        this.initToastContainer();
        
        FXLogger.info('FX ShadCN plugin initialized');
    }

    initializeComponents() {
        // Register all components with JSX engine
        const components = {
            'Button': FXButton,
            'Input': FXInput,
            'Card': FXCard,
            'CardHeader': FXCardHeader,
            'CardTitle': FXCardTitle,
            'CardContent': FXCardContent,
            'Dialog': FXDialog,
            'Toast': FXToast,
            'Select': FXSelect,
            'Badge': FXBadge
        };

        Object.keys(components).forEach(name => {
            jsx.component(name, components[name]);
        });
    }

    initToastContainer() {
        // Create toast container
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(this.toastContainer);
    }

    // Utility functions
    toast(options) {
        const toastId = `toast-${Date.now()}`;
        $$toast = $root(`ui.toasts.${toastId}`);
        
        $$toast.visible = true;
        $$toast.title = options.title || '';
        $$toast.description = options.description || '';
        $$toast.variant = options.variant || 'default';
        $$toast.duration = options.duration || 5000;

        const toastElement = jsx.render(`
            <Toast 
                visible={true}
                title="${options.title || ''}"
                description="${options.description || ''}"
                variant="${options.variant || 'default'}"
                duration={${options.duration || 5000}}
                onClose={() => this.removeToast('${toastId}')}
            />
        `);

        this.toastContainer.appendChild(toastElement);

        // Auto-remove after duration
        setTimeout(() => {
            this.removeToast(toastId);
        }, options.duration || 5000);

        return toastId;
    }

    removeToast(toastId) {
        $$toast = $root(`ui.toasts.${toastId}`);
        $$toast.visible = false;
        
        // Remove from DOM
        const toastElement = this.toastContainer.querySelector(`[data-toast-id="${toastId}"]`);
        if (toastElement) {
            toastElement.remove();
        }
    }
}

// Export plugin factory
export default function(fx, options) {
    return new FXShadCNPlugin(fx, options);
}