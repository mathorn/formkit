/**
 * Common, optional, first-party add on features for FormKit.
 *
 * You can add this package by using `npm install @formkit/addons` or `yarn add @formkit/addons`.
 *
 * @packageDocumentation
 */

import { AutoAnimateOptions } from '@formkit/auto-animate';
import { FormKitFrameworkContext } from '@formkit/core';
import type { FormKitInputs } from '@formkit/inputs';
import { FormKitNode } from '@formkit/core';
import { FormKitPlugin } from '@formkit/core';
import type { FormKitSlotData } from '@formkit/inputs';

/**
 * The typing for the beforeStepChange function.
 *
 * @public
 */
export declare interface BeforeStepChange {
    (data: BeforeStepChangeData): any;
}

export declare interface BeforeStepChangeData<T = unknown> {
    currentStep: FormKitFrameworkContext<T>;
    nextStep: FormKitFrameworkContext<T>;
    delta: number;
}

/**
 * Adds auto-animate to each input automatically:
 *
 * @example
 *
 * ```javascript
 * import { createApp } from 'vue'
 * import App from 'App.vue'
 * import { createAutoAnimatePlugin } from '@formkit/addons'
 * import { plugin, defaultConfig } from '@formkit/vue'
 *
 * createApp(app).use(plugin, defaultPlugin({
 *   plugins: [
 *     createAutoAnimatePlugin({
 *       // optional config
 *       duration: 250,
 *       easing: 'ease-in-out',
 *       delay: 0,
 *     },
 *     {
 *       // optional animation targets object
 *       global: ['outer', 'inner'],
 *       form: ['form'],
 *       repeater: ['items'],
 *     })
 *   ]
 * }))
 * ```
 *
 * @param options - {@link https://github.com/formkit/auto-animate/blob/master/src/index.ts#L596 | AutoAnimateOptions }
 * @param animationTargets - A map of input types and an array of their sections that should be animated.
 *
 * @returns
 * {@link @formkit/core#FormKitPlugin | FormKitPlugin}
     *
     * @public
     */
 export declare function createAutoAnimatePlugin(options?: AutoAnimateOptions, animationTargets?: Record<string, string[]>): FormKitPlugin;

 /**
  * Creates a new auto-height textarea plugin.
  *
  * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
  *
  * @public
  */
 export declare function createAutoHeightTextareaPlugin(): FormKitPlugin;

 /**
  * Creates a new floating label plugin.
  *
  * @param FloatingLabelsOptions - The options of {@link FloatingLabelsOptions | FloatingLabelsOptions} to pass to the plugin
  *
  * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
  *
  * @public
  */
 export declare function createFloatingLabelsPlugin(FloatingLabelsOptions?: FloatingLabelsOptions): FormKitPlugin;

 /**
  * Creates a new save-to-local-storage plugin.
  *
  * @param LocalStorageOptions - The options of {@link LocalStorageOptions | LocalStorageOptions} to pass to the plugin
  *
  * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
  *
  * @public
  */
 export declare function createLocalStoragePlugin(localStorageOptions?: LocalStorageOptions): FormKitPlugin;

 /**
  * Creates a new multi-step plugin.
  *
  * @param options - The options of {@link MultiStepOptions | MultiStepOptions} to pass to the plugin
  *
  * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
  *
  * @public
  */
 export declare function createMultiStepPlugin(options?: MultiStepOptions): FormKitPlugin;

 /**
  * The options to be passed to {@link createFloatingLabelsPlugin | createFloatingLabelsPlugin}
  *
  * @public
  */
 export declare interface FloatingLabelsOptions {
     useAsDefault?: boolean;
 }

 /**
  * The node type that is augmented with next and previous and goTo functions.
  *
  * @public
  */
 export declare type FormKitMultiStepNode = FormKitNode & MultiStepNodeAdditions;

 /**
  * The typing for the slot data for a FormKit multi-step input.
  * @public
  */
 export declare type FormKitMultiStepSlotData = FormKitFrameworkContext<Record<string, any>> & StepSlotData;

 /**
  * @public
  */
 export declare interface FormKitMultiStepSlots<Props extends FormKitInputs<Props>> {
     multiStepOuter: FormKitSlotData<Props, MultiStepSlotData>;
     wrapper: FormKitSlotData<Props, MultiStepSlotData>;
     tabs: FormKitSlotData<Props, MultiStepSlotData>;
     tab: FormKitSlotData<Props, MultiStepSlotData>;
     tabLabel: FormKitSlotData<Props, MultiStepSlotData & {
         step: FormKitFrameworkContext;
         index: number;
     }>;
     badge: FormKitSlotData<Props, MultiStepSlotData & {
         step: FormKitFrameworkContext;
         index: number;
     }>;
     validStepIcon: FormKitSlotData<Props, MultiStepSlotData & {
         step: FormKitFrameworkContext;
         index: number;
     }>;
     steps: FormKitSlotData<Props, MultiStepSlotData>;
     default: FormKitSlotData<Props, MultiStepSlotData>;
 }

 /**
  * @public
  */
 export declare interface FormKitStepSlots<Props extends FormKitInputs<Props>> {
     stepInner: FormKitSlotData<Props, StepSlotData>;
     stepActions: FormKitSlotData<Props, StepSlotData>;
     stepNext: FormKitSlotData<Props, StepSlotData>;
     stepPrevious: FormKitSlotData<Props, StepSlotData>;
     default: FormKitSlotData<Props, StepSlotData>;
 }

 /**
  * The options to be passed to {@link createLocalStoragePlugin | createLocalStoragePlugin}
  *
  * @param prefix - The prefix to use for the local storage key
  * @param key - The key to use for the local storage entry, useful for scoping data per user
  * @param control - The form control to use enable or disable saving to localStorage. Must return a boolean value.
  * @param maxAge - The maximum age of the local storage entry in milliseconds
  * @param debounce - The debounce time in milliseconds to use when saving to localStorage
  * @param beforeSave - A function to call for modifying data before saving to localStorage
  * @param beforeLoad - A function to call for modifying data before loading from localStorage
  *
  * @public
  */
 export declare interface LocalStorageOptions {
     prefix?: string;
     key?: string | number;
     control?: string;
     maxAge?: number;
     debounce?: number;
     beforeSave?: (payload: any) => any;
     beforeLoad?: (payload: any) => any;
 }

 export declare interface MultiStepHandlers {
     incrementStep: (delta: number, currentStep: FormKitFrameworkContext | undefined) => () => void;
     triggerStepValidations: (step: FormKitFrameworkContext) => void;
     showStepErrors: (step: FormKitFrameworkContext) => boolean | undefined;
     setActiveStep: (step: FormKitFrameworkContext) => (e?: Event) => void;
 }

 /**
  * Additional arguments that are added to the FormKitNode of a multistep input.
  *
  * @public
  */
 export declare interface MultiStepNodeAdditions {
     next: () => void;
     previous: () => void;
     goTo: (target: number | string) => void;
 }

 /**
  * The options to be passed to {@link createMultiStepPlugin | createMultiStepPlugin}
  *
  * @public
  */
 export declare interface MultiStepOptions {
     allowIncomplete?: boolean;
     hideProgressLabels?: boolean;
     tabStyle?: 'tab' | 'progress';
 }

 /**
  * @public
  */
 export declare interface MultiStepSlotData {
     steps: Array<FormKitMultiStepSlotData>;
     allowIncomplete?: boolean;
     tabStyle: 'tab' | 'progress';
     hideProgressLabels: boolean;
     validStepIcon: string | undefined;
     activeStep: string;
     beforeStepChange?: BeforeStepChange;
     node: FormKitMultiStepNode;
     handlers: FormKitFrameworkContext['handlers'] & MultiStepHandlers;
 }

 export declare interface StepHandlers {
     incrementStep: (delta: number) => () => void;
     next: () => void;
     previous: () => void;
 }

 /**
  * Slot data unique to the step input.
  *
  * @public
  */
 export declare interface StepSlotData {
     beforeStepChange?: BeforeStepChange;
     makeActive: () => void;
     blockingCount: number;
     errorCount: number;
     hasBeenVisited: true | undefined;
     isActiveStep: boolean;
     isFirstStep: boolean;
     isLastStep: boolean;
     isValid: boolean;
     nextAttrs?: Record<string, any>;
     nextLabel?: string;
     ordered: boolean;
     previousAttrs?: Record<string, any>;
     previousLabel?: string;
     showStepErrors: boolean;
     stepName: string;
     steps: Array<FormKitMultiStepSlotData>;
     stepIndex: number;
     totalErrorCount: number;
     validStepIcon?: string;
     handlers: FormKitFrameworkContext['handlers'] & StepHandlers;
 }

 /* <declare> */

/**
 * Extend FormKitNode with Multi-step helper functions.
 */
declare module '@formkit/core' {
  interface FormKitNodeExtensions {
    next(): void
    previous(): void
    goTo(step: number | string): void
  }
}
/* </declare> */
/* <declare> */
declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    'multi-step': {
      type: 'multi-step'
      value?: Record<string, any>
      allowIncomplete?: boolean
      tabStyle?: 'tab' | 'progress'
      hideProgressLabels?: boolean
      validStepIcon?: string
      beforeStepChange?: BeforeStepChange
    }
    step: {
      beforeStepChange?: BeforeStepChange
      nextAttrs?: Record<string, any>
      nextLabel?: string
      previousAttrs?: Record<string, any>
      previousLabel?: string
      type: 'step'
      validStepIcon?: string
      value?: Record<string, any>
    }
  }

  interface FormKitInputSlots<Props extends FormKitInputs<Props>> {
    'multi-step': FormKitMultiStepSlots<Props>
    step: FormKitStepSlots<Props>
  }
}

/**
 * The node type that is augmented with next and previous and goTo functions.
 *
 * @public
 */
export type FormKitMultiStepNode = FormKitNode & MultiStepNodeAdditions

/**
 * Additional arguments that are added to the FormKitNode of a multistep input.
 *
 * @public
 */
export interface MultiStepNodeAdditions {
  next: () => void
  previous: () => void
  goTo: (target: number | string) => void
}

/**
 * @public
 */
export interface MultiStepSlotData {
  steps: Array<FormKitMultiStepSlotData>
  allowIncomplete?: boolean
  tabStyle: 'tab' | 'progress'
  hideProgressLabels: boolean
  validStepIcon: string | undefined
  activeStep: string
  beforeStepChange?: BeforeStepChange
  node: FormKitMultiStepNode
  handlers: FormKitFrameworkContext['handlers'] & MultiStepHandlers
}

export interface MultiStepHandlers {
  incrementStep: (
    delta: number,
    currentStep: FormKitFrameworkContext | undefined
  ) => () => void
  triggerStepValidations: (step: FormKitFrameworkContext) => void
  showStepErrors: (step: FormKitFrameworkContext) => boolean | undefined
  setActiveStep: (step: FormKitFrameworkContext) => (e?: Event) => void
}
/**
 * Slot data unique to the step input.
 *
 * @public
 */
export interface StepSlotData {
  beforeStepChange?: BeforeStepChange
  makeActive: () => void
  blockingCount: number
  errorCount: number
  hasBeenVisited: true | undefined
  isActiveStep: boolean
  isFirstStep: boolean
  isLastStep: boolean
  isValid: boolean
  nextAttrs?: Record<string, any>
  nextLabel?: string
  ordered: boolean
  previousAttrs?: Record<string, any>
  previousLabel?: string
  showStepErrors: boolean
  stepName: string
  steps: Array<FormKitMultiStepSlotData>
  stepIndex: number
  totalErrorCount: number
  validStepIcon?: string
  handlers: FormKitFrameworkContext['handlers'] & StepHandlers
}

export interface StepHandlers {
  incrementStep: (delta: number) => () => void
  next: () => void
  previous: () => void
}

/**
 * @public
 */
export interface FormKitMultiStepSlots<Props extends FormKitInputs<Props>> {
  multiStepOuter: FormKitSlotData<Props, MultiStepSlotData>
  wrapper: FormKitSlotData<Props, MultiStepSlotData>
  tabs: FormKitSlotData<Props, MultiStepSlotData>
  tab: FormKitSlotData<Props, MultiStepSlotData>
  tabLabel: FormKitSlotData<
    Props,
    MultiStepSlotData & {
      step: FormKitFrameworkContext
      index: number
    }
  >
  badge: FormKitSlotData<
    Props,
    MultiStepSlotData & {
      step: FormKitFrameworkContext
      index: number
    }
  >
  validStepIcon: FormKitSlotData<
    Props,
    MultiStepSlotData & {
      step: FormKitFrameworkContext
      index: number
    }
  >
  steps: FormKitSlotData<Props, MultiStepSlotData>
  default: FormKitSlotData<Props, MultiStepSlotData>
}

/**
 * @public
 */
export interface FormKitStepSlots<Props extends FormKitInputs<Props>> {
  stepInner: FormKitSlotData<Props, StepSlotData>
  stepActions: FormKitSlotData<Props, StepSlotData>
  stepNext: FormKitSlotData<Props, StepSlotData>
  stepPrevious: FormKitSlotData<Props, StepSlotData>
  default: FormKitSlotData<Props, StepSlotData>
}

/* </declare> */
