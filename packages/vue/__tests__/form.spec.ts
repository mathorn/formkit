import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { getNode } from '@formkit/core'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { jest } from '@jest/globals'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('form structure', () => {
  it('renders a form with a button', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'form',
        name: 'test_form',
      },
      slots: {
        default: () => h('h1', 'in the form'),
      },
      ...global,
    })
    expect(wrapper.html()).toEqual(`<form class="formkit-form" name="test_form">
  <h1>in the form</h1>
  <!---->
  <div class="formkit-actions">
    <div class="formkit-outer" data-type="submit">
      <!---->
      <div class="formkit-wrapper"><button type="submit" class="formkit-input" name="submit_1" id="input_1">Submit</button></div>
      <!---->
    </div>
  </div>
</form>`)
  })
})

describe('form submission', () => {
  it('wont submit the form when it has errors', async () => {
    const submitHandler = jest.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(submitHandler).not.toHaveBeenCalled()
  })

  it('will call the submit handler when the form has no errors', async () => {
    const submitHandler = jest.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit validation="required|email" value="foo@bar.com" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(submitHandler).toHaveBeenCalledTimes(1)
  })

  it('sets submitted state when form is submitted', async () => {
    const submitHandler = jest.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit id="email" validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    const node = getNode('email')
    expect(node?.context?.state?.submitted).toBe(true)
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
  })

  it('fires a submit-raw event even with validation errors', async () => {
    const submitHandler = jest.fn()
    const rawHandler = jest.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
          rawHandler,
        },
        template: `<FormKit type="form" id="login" @submit-raw="rawHandler" @submit="submitHandler">
        <FormKit validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(submitHandler).not.toHaveBeenCalled()
    expect(rawHandler).toHaveBeenCalledTimes(1)
  })

  it('sets a loading state if handler is async', async () => {
    const submitHandler = jest.fn(() => {
      return new Promise((r) => setTimeout(r, 20))
    })
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" id="form" @submit="submitHandler">
        <FormKit name="email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    const node = getNode('form')
    expect(node?.context?.state?.loading).toBe(true)
    await new Promise((r) => setTimeout(r, 25))
    expect(node?.context?.state?.loading).toBe(undefined)
  })

  it('does not register the submit button', () => {
    const wrapper = mount(
      {
        methods: {
          submitHandler: () => undefined,
        },
        template: `<FormKit type="form" id="submitButtonForm" @submit="submitHandler">
        <FormKit validation="email" name="email" value="foo@bar.com" />
        <FormKit validation="required" name="country" value="de" :options="{ us: 'usa', de: 'germany' }" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    const node = getNode('submitButtonForm')
    expect(node?.value).toStrictEqual({ email: 'foo@bar.com', country: 'de' })
  })

  it('allows adding an attribute to submit button', () => {
    const wrapper = mount(
      {
        methods: {
          submitHandler: () => undefined,
        },
        template: `<FormKit
          type="form"
          id="submitButtonForm"
          @submit="submitHandler"
          :submit-attrs="{ 'data-foo': 'bar bar' }"
        >
          Content
        </FormKit>`,
      },
      global
    )
    expect(wrapper.find('button[data-foo="bar bar"]').exists()).toBe(true)
  })

  it('can disable all inputs in a form', () => {
    const wrapper = mount(
      {
        template: `<FormKit
          type="form"
          disabled
        >
          <FormKit id="disabledEmail" type="email" />
          <FormKit id="disabledSelect" type="select" />
        </FormKit>`,
      },
      global
    )
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(true)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(true)
  })

  it('can reactively disable and enable all inputs in a form', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            disabled: false,
          }
        },
        template: `<FormKit
          type="form"
          :disabled="disabled"
        >
          <FormKit id="disabledEmail" type="email" />
          <FormKit id="disabledSelect" type="select" />
        </FormKit>`,
      },
      global
    )
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(false)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(
      false
    )
    wrapper.setData({ disabled: true })
    await nextTick()
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(true)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(true)
  })
})
