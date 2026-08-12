'use client';;
import * as React from 'react';
import { Dialog as DialogPrime } from 'radix-ui';
import { AnimatePresence, motion } from 'motion/react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Dialog(props) {
  return <DialogPrimitive {...props} />;
}

function DialogTrigger(props) {
  return <DialogTriggerPrimitive {...props} />;
}

function DialogClose(props) {
  return <DialogClosePrimitive {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (<DialogOverlayPrimitive className={cn('fixed inset-0 z-50 bg-black/50', className)} {...props} />);
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return (
    <DialogPortalPrimitive>
      <DialogOverlay />
      <DialogContentPrimitive
        className={cn(
          'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg',
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogClosePrimitive
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClosePrimitive>
        )}
      </DialogContentPrimitive>
    </DialogPortalPrimitive>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <DialogHeaderPrimitive
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <DialogFooterPrimitive
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogTitlePrimitive
      className={cn('text-lg leading-none font-semibold', className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (<DialogDescriptionPrimitive className={cn('text-muted-foreground text-sm', className)} {...props} />);
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };



const [DialogProvider, useDialog] =
  getStrictContext('DialogContext');

function DialogPrimitive(props) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });

  return (
    <DialogProvider value={{ isOpen, setIsOpen }}>
      <DialogPrime.Root data-slot="dialog" {...props} onOpenChange={setIsOpen} />
    </DialogProvider>
  );
}

function DialogTriggerPrimitive(props) {
  return <DialogPrime.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortalPrimitive(props) {
  const { isOpen } = useDialog();

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrime.Portal data-slot="dialog-portal" forceMount {...props} />
      )}
    </AnimatePresence>
  );
}

function DialogOverlayPrimitive({
  transition = { duration: 0.2, ease: 'easeInOut' },
  ...props
}) {
  return (
    <DialogPrime.Overlay data-slot="dialog-overlay" asChild forceMount>
      <motion.div
        key="dialog-overlay"
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(4px)' }}
        transition={transition}
        {...props} />
    </DialogPrime.Overlay>
  );
}

function DialogContentPrimitive({
  from = 'top',
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  transition = { type: 'spring', stiffness: 150, damping: 25 },
  ...props
}) {
  const initialRotation =
    from === 'bottom' || from === 'left' ? '20deg' : '-20deg';
  const isVertical = from === 'top' || from === 'bottom';
  const rotateAxis = isVertical ? 'rotateX' : 'rotateY';

  return (
    <DialogPrime.Content
      asChild
      forceMount
      onOpenAutoFocus={onOpenAutoFocus}
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={onEscapeKeyDown}
      onPointerDownOutside={onPointerDownOutside}
      onInteractOutside={onInteractOutside}>
      <motion.div
        key="dialog-content"
        data-slot="dialog-content"
        initial={{
          opacity: 0,
          filter: 'blur(4px)',
          transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
        }}
        animate={{
          opacity: 1,
          filter: 'blur(0px)',
          transform: `perspective(500px) ${rotateAxis}(0deg) scale(1)`,
        }}
        exit={{
          opacity: 0,
          filter: 'blur(4px)',
          transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
        }}
        transition={transition}
        {...props} />
    </DialogPrime.Content>
  );
}

function DialogClosePrimitive(props) {
  return <DialogPrime.Close data-slot="dialog-close" {...props} />;
}

function DialogHeaderPrimitive(props) {
  return <div data-slot="dialog-header" {...props} />;
}

function DialogFooterPrimitive(props) {
  return <div data-slot="dialog-footer" {...props} />;
}

function DialogTitlePrimitive(props) {
  return <DialogPrime.Title data-slot="dialog-title" {...props} />;
}

function DialogDescriptionPrimitive(props) {
  return (<DialogPrime.Description data-slot="dialog-description" {...props} />);
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState(props) {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = React.useState(value !== undefined ? value : (defaultValue));

  React.useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = React.useCallback((next, ...args) => {
    setInternalState(next);
    onChange?.(next, ...args);
  }, [onChange]);

  return [state, setState];
}


function getStrictContext(name) {
  const Context = React.createContext(undefined);

  const Provider = ({
    value,
    children
  }) => <Context.Provider value={value}>{children}</Context.Provider>;

  const useSafeContext = () => {
    const ctx = React.useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name ?? 'a Provider'}`);
    }
    return ctx;
  };

  return [Provider, useSafeContext];
}

export { getStrictContext };
