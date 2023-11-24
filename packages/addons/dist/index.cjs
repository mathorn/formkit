'use strict';

var core = require('@formkit/core');
var autoAnimate = require('@formkit/auto-animate');
var inputs = require('@formkit/inputs');
var utils = require('@formkit/utils');

const pendingIds = new Map();
const optionOverrides = new Map();
let autoAnimateOptionsId = 0;
let observer = null;
let observerTimeout = 0;
/**
 * Create a new mutation observer that checks for the document for ids. We do
 * this instead of iterating over the mutations because getElementById is by far
 * the fastest way check for an element in the DOM, much faster that iterating
 * over the mutations themselves.
 */
function createObserver() {
    observeIds();
    observer = new MutationObserver(() => {
        observeIds();
        if (!pendingIds.size && observer) {
            observer.disconnect();
            observer = null;
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}
function observeIds() {
    pendingIds.forEach((options, id) => {
        const outer = document.getElementById(id);
        if (outer) {
            clearTimeout(observerTimeout);
            pendingIds.delete(id);
            observerTimeout = setTimeout(() => {
                const targets = document.querySelectorAll('[data-auto-animate]');
                targets.forEach((target) => {
                    // get the value of data-auto-animate
                    let overrideOptions;
                    const optionsId = target.getAttribute('data-auto-animate');
                    if (optionsId) {
                        overrideOptions = optionOverrides.get(optionsId);
                    }
                    autoAnimate(target, overrideOptions || options || {});
                });
            }, 250);
        }
    });
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
function createAutoAnimatePlugin(options, animationTargets = {
    global: ['outer', 'inner'],
    form: ['form'],
    repeater: ['items'],
}) {
    return (node) => {
        node.on('created', () => {
            var _a;
            if (typeof ((_a = node.props.definition) === null || _a === void 0 ? void 0 : _a.schema) === 'function') {
                if (typeof window === undefined)
                    return;
                // make a copy of the original schema
                const originalSchema = node.props.definition.schema;
                // add an outer wrapper id or get the current one
                node.props.definition.schema = (extensions) => {
                    const schema = originalSchema(extensions);
                    const finalSchema = Array.isArray(schema) ? schema[0] : schema;
                    inputs.eachSection(finalSchema, (section) => {
                        var _a, _b, _c, _d;
                        if (core.isDOM(section)) {
                            let isAnimationTarget = false;
                            const sectionName = (_a = section === null || section === void 0 ? void 0 : section.meta) === null || _a === void 0 ? void 0 : _a.section;
                            let instanceId = true;
                            // If we have explicit autoAnimate meta set, use that
                            if ((_b = section === null || section === void 0 ? void 0 : section.meta) === null || _b === void 0 ? void 0 : _b.autoAnimate) {
                                isAnimationTarget = true;
                                if (typeof section.meta.autoAnimate === 'object') {
                                    const newOptions = Object.assign({}, options, section.meta.autoAnimate);
                                    instanceId = `${node.props.id}-${autoAnimateOptionsId++}`;
                                    optionOverrides.set(instanceId, newOptions);
                                }
                            }
                            // if didn't have meta but we have a section name, check if it's a known animation target
                            if (!isAnimationTarget &&
                                sectionName &&
                                typeof sectionName === 'string') {
                                if (((_c = animationTargets.global) === null || _c === void 0 ? void 0 : _c.includes(sectionName)) ||
                                    ((_d = animationTargets[node.props.type]) === null || _d === void 0 ? void 0 : _d.includes(sectionName))) {
                                    isAnimationTarget = true;
                                }
                            }
                            // bail if we we're not a match
                            if (!isAnimationTarget)
                                return;
                            // add the auto-animate attribute which our observer will pick up
                            if (!(section === null || section === void 0 ? void 0 : section.attrs)) {
                                section.attrs = { 'data-auto-animate': instanceId };
                            }
                            else {
                                Object.assign(section.attrs, {
                                    'data-auto-animate': instanceId,
                                });
                            }
                            // add the node id to the pending list
                            if (node.props.id) {
                                pendingIds.set(node.props.id, options);
                            }
                        }
                    });
                    return finalSchema;
                };
            }
            if (!observer && typeof window !== 'undefined')
                createObserver();
        });
    };
}

/**
 * Contains the "next" action element for a multi-step step.
 *
 * @public
 */
const badge = inputs.createSection('badge', () => ({
    $el: 'span',
    attrs: {
        role: 'presentation',
    },
}));

/**
 * Contains the action buttons for a multi-step step.
 *
 * @public
 */
const stepActions = inputs.createSection('stepActions', () => ({
    $el: 'div',
}));

/**
 * Inner section of a multi-step step.
 *
 * @public
 */
const stepInner = inputs.createSection('stepInner', 'div');

/**
 * Contains the "next" action element for a multi-step step.
 *
 * @public
 */
const stepNext = inputs.createSection('stepNext', () => ({
    $el: 'div',
    if: '$isLastStep === false || $stepIndex === 0',
    children: [
        {
            $cmp: 'FormKit',
            bind: '$nextAttrs',
            props: {
                type: 'button',
                label: {
                    if: '$nextLabel',
                    then: '$nextLabel',
                    else: '$ui.next.value',
                },
                'data-next': '$isLastStep === false',
                onClick: '$handlers.next',
            },
        },
    ],
}));

/**
 * Outer section of a multi-step step. Has conditinal styling
 * depending on if it's the $activeStep.
 *
 * @public
 */
const stepOuter = inputs.createSection('stepOuter', () => ({
    $el: 'div',
    attrs: {
        key: '$id',
        'data-type': 'step',
        'data-disabled': '$disabled || undefined',
        'data-complete': '$state.complete || undefined',
        'data-invalid': '$state.valid === false && $state.validationVisible || undefined',
        'data-errors': '$state.errors || undefined',
        'data-submitted': '$state.submitted || undefined',
        id: '$id',
        role: 'tabpanel',
        'aria-labelledby': '$node.parent.props.id + "_tab_" + $stepIndex',
        class: '$classes.step',
        hidden: '$isActiveStep === false || undefined',
    },
}));

/**
 * Contains the "previous" action element for a multi-step step.
 *
 * @public
 */
const stepPrevious = inputs.createSection('stepPrevious', () => ({
    $el: 'div',
    if: '$isFirstStep === false',
    children: [
        {
            $cmp: 'FormKit',
            bind: '$previousAttrs',
            props: {
                type: 'button',
                label: {
                    if: '$previousLabel',
                    then: '$previousLabel',
                    else: '$ui.prev.value',
                },
                'data-prev': '$isFirstStep === false',
                onClick: '$handlers.previous',
            },
        },
    ],
}));

/**
 * Steps section, wraps all the steps of a multi-step form
 *
 * @public
 */
const steps = inputs.createSection('steps', () => ({
    $el: 'div',
}));

/**
 * Icon section used by multi-step steps
 *
 * @public
 */
const stepIcon = (sectionKey, el) => {
    return inputs.createSection(`${sectionKey}Icon`, () => {
        const rawIconProp = `_raw${sectionKey
            .charAt(0)
            .toUpperCase()}${sectionKey.slice(1)}Icon`;
        return {
            if: `$step.${sectionKey}Icon && $step.${rawIconProp}`,
            then: {
                $el: `${el ? el : 'span'}`,
                attrs: {
                    class: `$classes.${sectionKey}Icon + " formkit-icon"`,
                    innerHTML: `$step.${rawIconProp}`,
                    role: 'presentation',
                    onClick: `$handlers.iconClick(${sectionKey})`,
                },
            },
            else: {
                if: `$${sectionKey}Icon && $${rawIconProp}`,
                then: {
                    $el: `${el ? el : 'span'}`,
                    attrs: {
                        class: `$classes.${sectionKey}Icon + " formkit-icon"`,
                        innerHTML: `$${rawIconProp}`,
                        role: 'presentation',
                        onClick: `$handlers.iconClick(${sectionKey})`,
                    },
                },
            },
        };
    })();
};

/**
 * Tab section, holds a group of tabs
 *
 * @public
 */
const tab = inputs.createSection('tab', () => ({
    $el: 'button',
    for: ['step', 'index', '$steps'],
    attrs: {
        key: '$step.id',
        type: 'button',
        onClick: '$step.makeActive',
        'data-active': '$step.isActiveStep',
        'data-valid': '$step.isValid',
        'data-visited': '$step.hasBeenVisited',
        role: 'tab',
        id: '$id + "_tab_" + $index',
        'aria-selected': '$step.isActiveStep || false',
        'aria-controls': '$step.id',
        tabindex: {
            if: '$step.isActiveStep',
            then: '0',
            else: '-1',
        },
    },
}));

/**
 * the label for a tab in a multi-step input
 *
 * @public
 */
const tabLabel = inputs.createSection('tabLabel', () => ({
    $el: 'span',
}));

/**
 * Tab section, holds a group of tabs
 *
 * @public
 */
const tabs = inputs.createSection('tabs', () => ({
    $el: 'div',
    attrs: {
        role: 'tablist',
    },
}));

/**
 * Outer section of the multi-step where most data attributes are assigned.
 *
 * @public
 */
const multiStepOuter = inputs.createSection('multiStepOuter', () => ({
    $el: 'div',
    attrs: {
        key: '$id',
        id: '$id',
        class: '$classes.outer',
        'data-family': '$family || undefined',
        'data-type': '$type',
        'data-multiple': '$attrs.multiple || ($type != "select" && $options != undefined) || undefined',
        'data-disabled': '$disabled || undefined',
        'data-complete': '$state.complete || undefined',
        'data-invalid': '$state.valid === false && $state.validationVisible || undefined',
        'data-errors': '$state.errors || undefined',
        'data-submitted': '$state.submitted || undefined',
    },
}));

const multiStep = {
    /**
     * The actual schema of the input, or a function that returns the schema.
     */
    schema: multiStepOuter(inputs.$extend(inputs.wrapper(tabs(tab(inputs.$if('$tabStyle === "tab" || ($tabStyle === "progress" && $hideProgressLabels === false)', tabLabel('$step.stepName')), inputs.$if('($step.totalErrorCount > 0) && $step.showStepErrors', badge('$step.totalErrorCount')), inputs.$if('$step.isValid && $step.hasBeenVisited', badge(stepIcon('validStep'))))), steps('$slots.default')), {
        attrs: {
            'data-tab-style': '$tabStyle',
            'data-hide-labels': '$hideProgressLabels',
        },
    })),
    /**
     * The type of node, can be a list, group, or input.
     */
    type: 'group',
    /**
     * The family of inputs this one belongs too. For example "text" and "email"
     * are both part of the "text" family. This is primary used for styling.
     */
    family: 'multi-step',
    /**
     * An array of extra props to accept for this input.
     */
    props: [
        'allowIncomplete',
        'hideProgressLabels',
        'tabStyle',
        'beforeStepChange',
        'validStepIcon',
    ],
    /**
     * Additional features that should be added to your input
     */
    features: [inputs.defaultIcon('validStep', 'check'), inputs.disablesChildren],
};
const step = {
    /**
     * The actual schema of the input, or a function that returns the schema.
     */
    schema: stepOuter(stepInner('$slots.default'), stepActions(stepPrevious(), stepNext())),
    /**
     * The type of node, can be a list, group, or input.
     */
    type: 'group',
    /**
     * The family of inputs this one belongs too. For example "text" and "email"
     * are both part of the "text" family. This is primary used for styling.
     */
    family: '',
    /**
     * An array of extra props to accept for this input.
     */
    props: [
        'previousLabel',
        'nextLabel',
        'beforeStepChange',
        'previousAttrs',
        'nextAttrs',
        'validStepIcon',
    ],
    /**
     * Additional features that should be added to your input
     */
    features: [inputs.localize('next'), inputs.localize('prev'), inputs.disablesChildren],
};

/* </declare> */
const isBrowser = typeof window !== 'undefined';
/**
 * Coverts a camelCase string to a title case string
 *
 * @param str - The string to convert
 * @returns string
 */
const camel2title = (str) => {
    if (!str)
        return str;
    return str
        .replace(/([A-Z])/g, (match) => ` ${match}`)
        .replace(/^./, (match) => match.toUpperCase())
        .trim();
};
/**
 * Compares steps to DOM order and reorders steps if needed
 */
function orderSteps(node, steps) {
    if (!isBrowser || !steps)
        return steps;
    const orderedSteps = [...steps];
    orderedSteps.sort((a, b) => {
        var _a, _b;
        const aEl = (_a = node.props.__root) === null || _a === void 0 ? void 0 : _a.getElementById(a.id);
        const bEl = (_b = node.props.__root) === null || _b === void 0 ? void 0 : _b.getElementById(b.id);
        if (!aEl || !bEl)
            return 0;
        return aEl.compareDocumentPosition(bEl) === 2 ? 1 : -1;
    });
    orderedSteps.map((step) => {
        step.ordered = true;
    });
    return orderedSteps;
}
/**
 * Iterates through each step and sets props to help
 * determine step positioning within the multi-step.
 *
 * @param steps - The steps to iterate through
 */
function setNodePositionProps(steps) {
    if (!steps)
        return;
    steps.forEach((step, index) => {
        step.isFirstStep = index === 0;
        step.isLastStep = index === steps.length - 1;
        step.stepIndex = index;
        step.steps = steps;
    });
}
function showStepErrors(step) {
    if (!step.showStepErrors)
        return;
    return (parseInt(step.blockingCount) +
        parseInt(step.errorCount) >
        0);
}
/**
 * Determines if the target step can be navigated to based on current
 * configuration options and the state of the current step.
 *
 * @param currentStep - The current step
 * @param targetStep - The target step
 */
async function isTargetStepAllowed(currentStep, targetStep) {
    var _a, _b, _c;
    if (currentStep === targetStep)
        return true;
    const { allowIncomplete } = ((_a = currentStep.node.parent) === null || _a === void 0 ? void 0 : _a.props) || {};
    const parentNode = currentStep.node.parent;
    const currentStepIndex = parentNode === null || parentNode === void 0 ? void 0 : parentNode.props.steps.indexOf(currentStep);
    const targetStepIndex = parentNode === null || parentNode === void 0 ? void 0 : parentNode.props.steps.indexOf(targetStep);
    // check if there is a function for the stepChange guard
    const beforeStepChange = currentStep.node.props.beforeStepChange ||
        ((_b = currentStep.node.parent) === null || _b === void 0 ? void 0 : _b.props.beforeStepChange);
    if (beforeStepChange && typeof beforeStepChange === 'function') {
        if (parentNode) {
            parentNode === null || parentNode === void 0 ? void 0 : parentNode.store.set(core.createMessage({
                key: 'loading',
                value: true,
                visible: false,
            }));
            parentNode.props.disabled = true;
            currentStep.disabled = true;
        }
        const result = await beforeStepChange({
            currentStep,
            targetStep,
            delta: targetStepIndex - currentStepIndex,
        });
        if (parentNode) {
            parentNode === null || parentNode === void 0 ? void 0 : parentNode.store.remove('loading');
            parentNode.props.disabled = false;
            currentStep.disabled = false;
        }
        if (typeof result === 'boolean' && !result)
            return false;
    }
    // show the current step errors because this step has
    // been visited.
    //triggerStepValidations(currentStep)
    //currentStep.showStepErrors = true
    if (targetStepIndex < currentStepIndex) {
        // we can always step backwards
        return true;
    }
    // check how many steps we need to step forward
    // and then check that each intermediate step is valid
    const delta = targetStepIndex - currentStepIndex;
    for (let i = 0; i < delta; i++) {
        const intermediateStep = parentNode === null || parentNode === void 0 ? void 0 : parentNode.props.steps[currentStepIndex + i];
        const stepIsAllowed = allowIncomplete || ((_c = intermediateStep.state) === null || _c === void 0 ? void 0 : _c.valid);
        if (!stepIsAllowed) {
            return false;
        }
    }
    return true;
}
/**
 * Changes the active step to the target step if the target step is allowed.
 *
 * @param targetStep - The target step
 */
async function setActiveStep(targetStep, e) {
    if (e) {
        e.preventDefault();
    }
    if (targetStep && targetStep.node.name && targetStep.node.parent) {
        const currentStep = targetStep.node.parent.props.steps.find((step) => { var _a; return step.node.name === ((_a = targetStep.node.parent) === null || _a === void 0 ? void 0 : _a.props.activeStep); });
        const stepIsAllowed = await isTargetStepAllowed(currentStep, targetStep);
        if (stepIsAllowed && targetStep.node.parent.context) {
            targetStep.node.parent.props.activeStep = targetStep.node.name;
        }
    }
}
/**
 * Changes the current step by the delta value if the target step is allowed.
 *
 * @param delta - The number of steps to increment or decrement
 * @param step - The current step
 */
async function incrementStep(delta, currentStep) {
    if (currentStep && currentStep.node.name && currentStep.node.parent) {
        const steps = currentStep.node.parent.props.steps;
        const stepIndex = currentStep.stepIndex;
        const targetStep = steps[stepIndex + delta];
        if (!targetStep)
            return;
        const stepIsAllowed = await isTargetStepAllowed(currentStep, targetStep);
        if (targetStep && stepIsAllowed) {
            currentStep.node.parent.props.activeStep = targetStep.node.name;
        }
    }
}
/**
 * Causes the display of any validation errors on the target step.
 *
 * @param step - The current step
 * @returns Boolean
 */
function triggerStepValidations(step) {
    var _a, _b;
    step.node.walk((n) => {
        n.store.set(core.createMessage({
            key: 'submitted',
            value: true,
            visible: false,
        }));
    });
    return (((_a = step.node.context) === null || _a === void 0 ? void 0 : _a.state.valid) || ((_b = step.node.parent) === null || _b === void 0 ? void 0 : _b.props.allowIncomplete));
}
function initEvents(node, el) {
    if (!(el instanceof HTMLElement))
        return;
    el.addEventListener('keydown', (event) => {
        var _a;
        if (event.target instanceof HTMLButtonElement) {
            if (event.key === 'Tab' &&
                'data-next' in ((_a = event.target) === null || _a === void 0 ? void 0 : _a.attributes) &&
                !event.shiftKey) {
                event.preventDefault();
                const activeStepContext = node.children.find((step) => !core.isPlaceholder(step) && step.name === node.props.activeStep);
                if (activeStepContext && activeStepContext.context) {
                    incrementStep(1, activeStepContext.context);
                }
            }
        }
    });
}
function createSSRStepsFromTabs(tabs) {
    if (!tabs || !tabs.length)
        return [];
    const placeholderTabs = tabs.map((tab, index) => {
        var _a, _b, _c;
        return {
            __isPlaceholder: true,
            stepName: ((_a = tab.props) === null || _a === void 0 ? void 0 : _a.label) || camel2title((_b = tab.props) === null || _b === void 0 ? void 0 : _b.name),
            isFirstStep: index === 0,
            isLastStep: index === tabs.length - 1,
            isActiveStep: index === 0,
            node: {
                name: (_c = tab.props) === null || _c === void 0 ? void 0 : _c.name,
            },
        };
    });
    return placeholderTabs;
}
/**
 * Creates a new multi-step plugin.
 *
 * @param options - The options of {@link MultiStepOptions | MultiStepOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
function createMultiStepPlugin(options) {
    let isFirstStep = true;
    const multiStepPlugin = (node) => {
        var _a, _b;
        if (node.props.type === 'multi-step') {
            if (!node.context)
                return;
            isFirstStep = true; // reset variable, next step will be first step in multistep
            node.addProps(['steps', 'tabs', 'activeStep']);
            // call the default slot to pre-render child steps
            // for SSR support
            if (node.context.slots &&
                node.context.slots.default) {
                node.props.tabs = node.context.slots.default();
            }
            node.props.steps =
                node.props.steps || createSSRStepsFromTabs(node.props.tabs);
            node.props.allowIncomplete =
                typeof node.props.allowIncomplete === 'boolean'
                    ? node.props.allowIncomplete
                    : typeof (options === null || options === void 0 ? void 0 : options.allowIncomplete) === 'boolean'
                        ? options === null || options === void 0 ? void 0 : options.allowIncomplete
                        : true;
            node.props.hideProgressLabels =
                typeof node.props.hideProgressLabels === 'boolean'
                    ? node.props.hideProgressLabels
                    : (options === null || options === void 0 ? void 0 : options.hideProgressLabels) || false;
            node.props.tabStyle = node.props.tabStyle || (options === null || options === void 0 ? void 0 : options.tabStyle) || 'tab';
            node.context.handlers.triggerStepValidations = triggerStepValidations;
            node.context.handlers.showStepErrors = showStepErrors;
            node.on('created', () => {
                if (!node.context)
                    return;
                node.extend('next', {
                    get: (node) => () => {
                        var _a;
                        incrementStep(1, (_a = node === null || node === void 0 ? void 0 : node.props) === null || _a === void 0 ? void 0 : _a.steps.find((step) => step.isActiveStep));
                    },
                    set: false,
                });
                node.extend('previous', {
                    get: (node) => () => {
                        var _a;
                        incrementStep(-1, (_a = node === null || node === void 0 ? void 0 : node.props) === null || _a === void 0 ? void 0 : _a.steps.find((step) => step.isActiveStep));
                    },
                    set: false,
                });
                node.extend('goTo', {
                    get: (node) => (target) => {
                        if (typeof target === 'number') {
                            const targetStep = node.props.steps[target];
                            setActiveStep(targetStep);
                        }
                        else if (typeof target === 'string') {
                            const targetStep = node.props.steps.find((step) => step.node.name === target);
                            setActiveStep(targetStep);
                        }
                    },
                    set: false,
                });
                utils.whenAvailable(`${node.props.id}`, (el) => {
                    initEvents(node, el);
                }, node.props.__root);
            });
            node.on('child', ({ payload: childNode }) => {
                // remove placeholder steps
                if (node.props.steps && node.props.steps.length) {
                    node.props.steps = node.props.steps.filter((step) => !step.__isPlaceholder);
                }
                node.props.steps =
                    Array.isArray(node.props.steps) && node.props.steps.length > 0
                        ? [...node.props.steps, childNode.context]
                        : [childNode.context];
                node.props.steps = orderSteps(node, node.props.steps);
                setNodePositionProps(node.props.steps);
                childNode.props.stepName =
                    childNode.props.label || camel2title(childNode.name);
                childNode.props.errorCount = 0;
                childNode.props.blockingCount = 0;
                childNode.props.isActiveStep = isFirstStep;
                isFirstStep = false;
                node.props.activeStep = node.props.activeStep
                    ? node.props.activeStep
                    : node.props.steps[0]
                        ? node.props.steps[0].node.name
                        : '';
            });
            node.on('prop:activeStep', ({ payload }) => {
                node.children.forEach((child) => {
                    var _a;
                    if (core.isPlaceholder(child))
                        return;
                    child.props.isActiveStep = child.name === payload;
                    if (isBrowser && child.name === payload) {
                        const el = (_a = node.props.__root) === null || _a === void 0 ? void 0 : _a.querySelector(`[aria-controls="${child.props.id}"]`);
                        if (el instanceof HTMLButtonElement) {
                            el.focus();
                        }
                    }
                });
            });
            node.on('childRemoved', ({ payload: childNode }) => {
                let removedStepIndex = -1;
                childNode.props.ordered = false;
                node.props.steps = node.props.steps.filter((step, index) => {
                    if (step.node.name !== childNode.name) {
                        return true;
                    }
                    removedStepIndex = index;
                    return false;
                });
                setNodePositionProps(node.props.steps);
                // if the child that was removed was the active step
                // then fallback to the next available step
                if (node.props.activeStep === childNode.name) {
                    const targetIndex = removedStepIndex > 0 ? removedStepIndex - 1 : 0;
                    node.props.activeStep = node.props.steps[targetIndex]
                        ? node.props.steps[targetIndex].node.name
                        : '';
                }
            });
        }
        else if (node.props.type === 'step' &&
            ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.props.type) === 'multi-step') {
            if (!node.context || !node.parent || !node.parent.context)
                return;
            node.addProps([
                'isActiveStep',
                'isFirstStep',
                'isLastStep',
                'stepName',
                'errorCount',
                'blockingCount',
                'totalErrorCount',
                'showStepErrors',
                'isValid',
                'hasBeenVisited',
                'ordered',
            ]);
            const parentNode = node.parent;
            node.on('created', () => {
                if (!node.context || !parentNode.context)
                    return;
                utils.whenAvailable(`${node.props.id}`, () => {
                    parentNode.props.steps = orderSteps(node, parentNode.props.steps);
                    setNodePositionProps(parentNode.props.steps);
                }, node.props.__root);
            });
            if (node.context && parentNode.context) {
                parentNode.context.handlers.setActiveStep = (stepNode) => setActiveStep.bind(null, stepNode);
                node.context.handlers.incrementStep = (delta) => () => incrementStep(delta, node.context);
                node.context.makeActive = () => {
                    setActiveStep(node.context);
                };
                node.context.handlers.next = () => incrementStep(1, node.context);
                node.context.handlers.previous = () => incrementStep(-1, node.context);
            }
            node.on('count:errors', ({ payload: count }) => {
                node.props.errorCount = count;
            });
            node.on('count:blocking', ({ payload: count }) => {
                node.props.blockingCount = count;
            });
            function updateTotalErrorCount(node) {
                node.props.totalErrorCount =
                    node.props.errorCount + node.props.blockingCount;
            }
            node.on('prop:errorCount', () => updateTotalErrorCount(node));
            node.on('prop:blockingCount', () => updateTotalErrorCount(node));
            node.on('prop:totalErrorCount', () => {
                node.props.isValid = node.props.totalErrorCount <= 0;
            });
            node.on('message-added', ({ payload }) => {
                if (payload.key === 'submitted') {
                    updateTotalErrorCount(node);
                    if (node.context) {
                        triggerStepValidations(node.context);
                        node.props.showStepErrors = true;
                    }
                }
            });
            node.on('prop:isActiveStep', () => {
                if (!node.props.hasBeenVisited && node.props.isActiveStep) {
                    node.props.hasBeenVisited = true;
                }
            });
        }
        else if (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.props.type) === 'multi-step') {
            console.warn('Invalid FormKit input location. <FormKit type="multi-step"> should only have <FormKit type="step"> inputs as immediate children. Failure to wrap child inputs in <FormKit type="step"> can lead to undesired behaviors.');
        }
    };
    multiStepPlugin.library = (node) => {
        switch (node.props.type) {
            case 'multi-step':
                return node.define(multiStep);
            case 'step':
                const isInvalid = !node.parent || node.parent.props.type !== 'multi-step';
                if (isInvalid) {
                    console.warn('Invalid use of <FormKit type="step">. <FormKit type="step"> must be an immediate child of a <FormKit type="multi-step"> component.');
                }
                return node.define(step);
        }
    };
    return multiStepPlugin;
}

/**
 * Creates a new floating label plugin.
 *
 * @param FloatingLabelsOptions - The options of {@link FloatingLabelsOptions | FloatingLabelsOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
function createFloatingLabelsPlugin(FloatingLabelsOptions) {
    const floatingLabelsPlugin = (node) => {
        node.addProps(['floatingLabel']);
        const useFloatingLabels = typeof node.props.floatingLabel === 'boolean'
            ? node.props.floatingLabel
            : typeof (FloatingLabelsOptions === null || FloatingLabelsOptions === void 0 ? void 0 : FloatingLabelsOptions.useAsDefault) === 'boolean'
                ? FloatingLabelsOptions === null || FloatingLabelsOptions === void 0 ? void 0 : FloatingLabelsOptions.useAsDefault
                : false;
        if (useFloatingLabels) {
            node.on('created', () => {
                if (!node.props || !node.props.definition)
                    return;
                const inputDefinition = utils.clone(node.props.definition);
                if (['text', 'dropdown'].includes(node.props.family) ||
                    ['datepicker', 'textarea'].includes(node.props.type)) {
                    const originalSchema = inputDefinition.schema;
                    if (typeof originalSchema !== 'function')
                        return;
                    const higherOrderSchema = (extensions) => {
                        extensions.outer = {
                            attrs: {
                                'data-floating-label': 'true',
                            },
                        };
                        extensions.label = {
                            attrs: {
                                'data-has-value': '$_value !== "" && $_value !== undefined',
                            },
                        };
                        const inputSchema = originalSchema(extensions);
                        const finalSchema = Array.isArray(inputSchema)
                            ? inputSchema[0]
                            : inputSchema;
                        const [labelParentChildren, labelSection] = inputs.findSection(finalSchema, 'label');
                        const [inputParentChildren] = inputs.findSection(finalSchema, 'input');
                        if (labelParentChildren && labelSection && inputParentChildren) {
                            labelParentChildren.splice(labelParentChildren.indexOf(labelSection), 1);
                            inputParentChildren.push(labelSection);
                        }
                        return inputSchema;
                    };
                    inputDefinition.schema = higherOrderSchema;
                    if (inputDefinition.schemaMemoKey) {
                        inputDefinition.schemaMemoKey += '-floating-label';
                    }
                    node.props.definition = inputDefinition;
                }
            });
        }
    };
    return floatingLabelsPlugin;
}

/**
 * Creates a new save-to-local-storage plugin.
 *
 * @param LocalStorageOptions - The options of {@link LocalStorageOptions | LocalStorageOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
function createLocalStoragePlugin(localStorageOptions) {
    const localStoragePlugin = (node) => {
        // only apply if internal FormKit type is 'group'. This applies
        // to 'form' and 'group' inputs — as well as any add-on inputs
        // registered of FormKit type 'group' (eg. 'multi-step').
        if (node.type !== 'group')
            return;
        // enable SSR support
        if (typeof window === "undefined")
            return;
        let cachedLocalStorageData = '';
        const shouldUseLocalStorage = (controlNode) => {
            let controlFieldValue = true;
            if (controlNode) {
                controlFieldValue = controlNode.value === true;
            }
            return utils.undefine(node.props.useLocalStorage) && controlFieldValue;
        };
        node.on('created', async () => {
            var _a, _b, _c;
            await node.settled;
            node.addProps(['useLocalStorage']);
            node.extend('restoreCache', {
                get: (node) => async () => {
                    if (!cachedLocalStorageData)
                        return;
                    await node.settled;
                    loadValue(cachedLocalStorageData);
                },
                set: false,
            });
            // if the user provided a control field, then we need to listen for changes
            // and use it to determine whether or not to use local storage
            const controlField = (_a = localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.control) !== null && _a !== void 0 ? _a : undefined;
            let controlNode;
            if (typeof controlField === 'string') {
                const controlNode = node.at(controlField);
                if (controlNode) {
                    controlNode.on('commit', () => {
                        useLocalStorage = shouldUseLocalStorage(controlNode);
                        if (!useLocalStorage) {
                            localStorage.removeItem(storageKey);
                        }
                    });
                }
            }
            let useLocalStorage = shouldUseLocalStorage(controlNode);
            let saveTimeout = 0;
            const debounce = typeof (localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.debounce) === 'number'
                ? localStorageOptions.debounce
                : 200;
            const prefix = (_b = localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.prefix) !== null && _b !== void 0 ? _b : 'formkit';
            const maxAge = (_c = localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.maxAge) !== null && _c !== void 0 ? _c : 3600000; // 1 hour
            const key = (localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.key) ? `-${localStorageOptions.key}` : ''; // for scoping to a specific user
            const storageKey = `${prefix}${key}-${node.name}`;
            const loadValue = async (forceValue) => {
                const value = forceValue || localStorage.getItem(storageKey);
                if (!value)
                    return;
                const loadValue = JSON.parse(value);
                if (typeof (localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.beforeLoad) === 'function') {
                    node.props.disabled = true;
                    try {
                        loadValue.data = await localStorageOptions.beforeLoad(loadValue.data);
                    }
                    catch (error) {
                        console.error(error);
                    }
                    node.props.disabled = false;
                }
                if (!loadValue || typeof loadValue.data !== 'object')
                    return;
                if (loadValue.maxAge > Date.now()) {
                    node.input(loadValue.data, false);
                }
                else {
                    localStorage.removeItem(storageKey);
                }
            };
            const saveValue = async (payload) => {
                let savePayload = payload;
                if (typeof (localStorageOptions === null || localStorageOptions === void 0 ? void 0 : localStorageOptions.beforeSave) === 'function') {
                    try {
                        savePayload = await localStorageOptions.beforeSave(payload);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                if (!savePayload)
                    return;
                localStorage.setItem(storageKey, JSON.stringify({
                    maxAge: Date.now() + maxAge,
                    data: savePayload,
                }));
            };
            node.on('commit', ({ payload }) => {
                if (!useLocalStorage)
                    return;
                // debounce the save to local storage
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(async () => {
                    saveValue(payload);
                }, debounce);
            });
            node.on('prop:useLocalStorage', () => {
                useLocalStorage = shouldUseLocalStorage(controlNode);
                if (!useLocalStorage) {
                    localStorage.removeItem(storageKey);
                }
            });
            node.hook.submit((payload, next) => {
                // cache data in case the user wants to restore
                cachedLocalStorageData = localStorage.getItem(storageKey);
                // remove from the localStorage cache
                localStorage.removeItem(storageKey);
                return next(payload);
            });
            await loadValue();
        });
    };
    return localStoragePlugin;
}

/**
 * Creates a new auto-height textarea plugin.
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
function createAutoHeightTextareaPlugin() {
    const autoHeightTextareaPlugin = (node) => {
        if (node.props.type !== 'textarea')
            return;
        node.addProps(['autoHeight', 'maxAutoHeight']);
        node.on('created', () => {
            const autoHeight = utils.undefine(node.props.autoHeight);
            const maxAutoHeight = Number.isFinite(node.props.maxAutoHeight)
                ? parseInt(node.props.maxAutoHeight)
                : undefined;
            if (!autoHeight || !node.context)
                return;
            let inputElement = null;
            utils.whenAvailable(node.context.id, () => {
                var _a, _b;
                inputElement = (_a = node.props.__root) === null || _a === void 0 ? void 0 : _a.getElementById(((_b = node === null || node === void 0 ? void 0 : node.context) === null || _b === void 0 ? void 0 : _b.id) ? node.context.id : '');
                if (!(inputElement instanceof HTMLTextAreaElement))
                    return;
                if (!document.getElementById('formkit-auto-height-textarea-style')) {
                    const scrollbarStyle = document.createElement('style');
                    scrollbarStyle.setAttribute('id', 'formkit-auto-height-textarea-style');
                    scrollbarStyle.textContent = `.formkit-auto-height-textarea { scrollbar-width: none; } .formkit-auto-height-textarea::-webkit-scrollbar { display: none; }`;
                    document.body.appendChild(scrollbarStyle);
                }
                const hiddenTextarea = inputElement.cloneNode(false);
                hiddenTextarea.classList.add('formkit-auto-height-textarea');
                if (!maxAutoHeight) {
                    inputElement.classList.add('formkit-auto-height-textarea');
                }
                hiddenTextarea.setAttribute('style', 'height: 0; min-height: 0; pointer-events: none; opacity: 0;  left: -9999px; padding-top: 0; padding-bottom: 0; position: absolute; display: block; top: 0; z-index: -1; scrollbar-width: none;');
                hiddenTextarea.removeAttribute('name');
                hiddenTextarea.removeAttribute('id');
                hiddenTextarea.removeAttribute('aria-describedby');
                const isBorderBox = getComputedStyle(inputElement).boxSizing === 'border-box';
                const paddingY = parseInt(getComputedStyle(inputElement).paddingTop) +
                    parseInt(getComputedStyle(inputElement).paddingBottom);
                const paddingX = parseInt(getComputedStyle(inputElement).paddingTop) +
                    parseInt(getComputedStyle(inputElement).paddingBottom);
                let lastValue = node._value;
                inputElement.after(hiddenTextarea);
                calculateHeight({ payload: node._value });
                node.on('input', calculateHeight);
                async function calculateHeight({ payload }) {
                    lastValue = payload;
                    if (!inputElement)
                        return;
                    await new Promise((r) => setTimeout(r, 10));
                    // If the current value is not the one we enqueued, just ignore.
                    if (lastValue !== payload)
                        return;
                    hiddenTextarea.value = payload;
                    const width = isBorderBox
                        ? inputElement.offsetWidth
                        : inputElement.offsetWidth - paddingX;
                    hiddenTextarea.style.width = `${width}px`;
                    const scrollHeight = hiddenTextarea.scrollHeight;
                    const height = isBorderBox ? scrollHeight + paddingY : scrollHeight;
                    const h = maxAutoHeight ? Math.min(height, maxAutoHeight) : height;
                    if (!inputElement.style.height) {
                        inputElement.style.height = `0px`;
                    }
                    inputElement.style.minHeight = `${h}px`;
                }
            }, node.props.__root);
        });
    };
    return autoHeightTextareaPlugin;
}

exports.createAutoAnimatePlugin = createAutoAnimatePlugin;
exports.createAutoHeightTextareaPlugin = createAutoHeightTextareaPlugin;
exports.createFloatingLabelsPlugin = createFloatingLabelsPlugin;
exports.createLocalStoragePlugin = createLocalStoragePlugin;
exports.createMultiStepPlugin = createMultiStepPlugin;
