<template>
  <div :class="[
    (props.label || 'default' in $slots) && 'switch-block',
    props.thin && (props.label || 'default' in $slots) && 'thin-switch-block',
    `is-${props.size}`,
  ]">
    <template v-if="props.thin">
      <VLabel raw class="thin-switch" tabindex="0" :class="[props.color && `is-${props.color}`]">
        <input :id="id" v-model="internal" :true-value="true" :false-value="false" class="input" type="checkbox"
          v-bind="$attrs" :disabled="props.disabled">
        <div class="slider" />
      </VLabel>
    </template>
    <template v-else>
      <VLabel raw class="form-switch" :class="[props.color && `is-${props.color}`, props.disabled && 'disabled']">
        <input :id="id" v-model="internal" :true-value="true" :false-value="false" type="checkbox" class="is-switch"
        :class="[props.disabled && 'disabled-switch']"
          v-bind="$attrs" :disabled="props.disabled">
        <i aria-hidden="true"  :class="[props.disabled && 'disabled-switch']" :style="{border: `${props.disabled ? '1px solid white' : ''} !important`, backgroundColor: `${props.disabled ? 'rgb(30, 32, 41)' : ''} !important`}"/>
      </VLabel>
    </template>

    <div v-if="props.label || 'default' in $slots" class="text">
      <VLabel raw>
        <span>
          <slot>
            {{ props.label }}
          </slot>
        </span>
      </VLabel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVFieldContext } from '/@src/composable/useVFieldContext'

export type VSwitchBlockColor = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export interface VSwitchBlockProps {
  label?: string
  color?: VSwitchBlockColor
  thin?: boolean
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

defineOptions({
  inheritAttrs: false,
})

const modelValue = defineModel({
  default: false,
  local: true,
})
const props = withDefaults(defineProps<VSwitchBlockProps>(), {
  label: undefined,
  color: undefined,
})

const { field, id } = useVFieldContext({
  create: false,
  help: 'VSwitchBlock',
})

const internal = computed({
  get() {
    if (field?.value) {
      return field.value.value
    } else {
      return modelValue.value
    }
  },
  set(value: any) {
    if (field?.value) {
      field.value.setValue(value)
    }
    modelValue.value = value
  },
})
</script>

<style lang="scss" scoped>

.disabled-switch {
  width: 100%;
  height: 100%;
  color: red !important;
  background-color: red !important;
  background: red !important;
}

.disabled-switch {
  width: 100%;
  height: 100%;
  color: red !important;
  background-color: red !important;
  background: red !important;
}
.switch-block.is-switch input[type="checkbox"]:disabled+i::before {
  color: #7a7a7a;
  /* Color del ícono del switch */
}

.switch-block.is-switch input[type="checkbox"]:disabled+i {
  cursor: not-allowed;
  /* Cambia el cursor al intentar hacer hover */
}

.form-switch {
  position: relative;
  display: inline-block;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-within {
    border-radius: 50px;
    outline-offset: var(--accessibility-focus-outline-offset);
    outline-width: var(--accessibility-focus-outline-width);
    outline-style: var(--accessibility-focus-outline-style);
    outline-color: var(--accessibility-focus-outline-color);
  }

  &.is-primary {
    input {
      &:checked+i {
        background-color: var(--primary);
      }
    }
  }

  &.is-success {
    input {
      &:checked+i {
        background-color: var(--success);
      }
    }
  }

  &.is-info {
    input {
      &:checked+i {
        background-color: var(--info);
      }
    }
  }

  &.is-warning {
    input {
      &:checked+i {
        background-color: var(--warning);
      }
    }
  }

  &.is-danger {
    input {
      &:checked+i {
        background-color: var(--danger);
      }
    }
  }

  i {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 26px;
    background-color: hsl(240 4% 36%);
    border-radius: 23px;
    vertical-align: text-bottom;
    transition: all 0.3s linear;

    &::before {
      content: '';
      position: absolute;
      inset-inline-start: 0;
      width: 42px;
      height: 22px;
      background-color: hsl(240 4% 36%);
      border-radius: 11px;
      transform: translate3d(calc(var(--transform-direction) * 2px), 2px, 0) scale3d(1, 1, 1);
      transition: all 0.25s linear;
    }

    &::after {
      content: '';
      position: absolute;
      inset-inline-start: 0;
      width: 22px;
      height: 22px;
      background-color: var(--white);
      border-radius: 11px;
      box-shadow: 0 2px 2px rgb(0 0 0 / 24%);
      transform: translate3d(calc(var(--transform-direction) * 2px), 2px, 0);
      transition: all 0.2s ease-in-out;
    }
  }

  &:active {
    i::after {
      width: 28px;
      transform: translate3d(calc(var(--transform-direction) * 2px), 2px, 0);
    }

    input {
      &:checked+i::after {
        transform: translate3d(calc(var(--transform-direction) * 16px), 2px, 0);
      }
    }
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;

    &:checked+i {
      background-color: var(--light-text);

      &::before {
        transform: translate3d(calc(var(--transform-direction) * 18px), 2px, 0) scale3d(0, 0, 0);
      }

      &::after {
        transform: translate3d(calc(var(--transform-direction) * 22px), 2px, 0);
      }
    }
  }

  small {
    color: var(--muted-grey);
    position: relative;
    top: -4px;
  }
}

.switch-block {
  padding: 10px 0;
  display: flex;
  align-items: center;

  .text {
    margin-inline-start: 6px;

    span {
      display: block;
      position: relative;
      top: -2px;
      color: var(--light-text);
    }
  }
}

.is-dark {
  .form-switch {
    &.is-primary {
      input {
        background-color: red !important;

        &:checked+i {
          background-color: var(--primary) !important;

          &::after {
            background: var(--white) !important;
          }
        }
      }
    }

    &.is-success {
      input {
        &:checked+i {
          background-color: var(--success) !important;

          &::after {
            background: var(--white) !important;
          }
        }
      }
    }

    &.is-info {
      input {
        &:checked+i {
          background-color: var(--info) !important;

          &::after {
            background: var(--white) !important;
          }
        }
      }
    }

    &.is-warning {
      input {
        &:checked+i {
          background-color: var(--warning) !important;

          &::after {
            background: var(--white) !important;
          }
        }
      }
    }

    &.is-danger {
      input {
        &:checked+i {
          background-color: var(--danger) !important;

          &::after {
            background: var(--white) !important;
          }
        }
      }
    }

    i {
      background: var(--dark-sidebar-light-55) !important;

      &::before {
        background: var(---dark-sidebar-light-55) !important;
      }

      &::after {
        background: var(--dark-sidebar-light-22) !important;
      }
    }

    input {
      &:checked+i {
        &::after {
          background: var(--dark-sidebar-light-55) !important;
        }
      }
    }
  }
}

.thin-switch {
  display: block;
  margin-inline-start: 8px;

  &:focus-visible .slider::after {
    border-radius: 50px;
    outline-offset: var(--accessibility-focus-outline-offset);
    outline-width: var(--accessibility-focus-outline-width);
    outline-style: var(--accessibility-focus-outline-style);
    outline-color: var(--accessibility-focus-outline-color);
  }

  &:focus-visible {
    outline: none !important;
  }

  &.is-primary {
    .input:checked~.slider {
      background: var(--primary-light-20);

      &::after {
        background: var(--primary);
        border-color: var(--primary);
      }
    }
  }

  &.is-success {
    .input:checked~.slider {
      background: var(--success-light-20);

      &::after {
        background: var(--success);
        border-color: var(--success);
      }
    }
  }

  &.is-info {
    .input:checked~.slider {
      background: var(--info-light-20);

      &::after {
        background: var(--info);
        border-color: var(--info);
      }
    }
  }

  &.is-warning {
    .input:checked~.slider {
      background: var(--warning-light-20);

      &::after {
        background: var(--warning);
        border-color: var(--warning);
      }
    }
  }

  &.is-danger {
    .input:checked~.slider {
      background: var(--danger-light-20);

      &::after {
        background: var(--danger);
        border-color: var(--danger);
      }
    }
  }

  .slider {
    position: relative;
    display: inline-block;
    height: 8px;
    width: 32px;
    border-radius: 8px;
    cursor: pointer;
    background: #c5c5c5;
    transition: all 0.3s; // transition-all test

    &::after {
      background: var(--light-grey);
      position: absolute;
      inset-inline-start: -8px;
      top: -8.5px;
      display: block;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-rounded);
      border: 1px solid transparent;
      box-shadow: 0 2px 2px rgba(#000, 0.2);
      content: '';
      transition: all 0.3s; // transition-all test
    }
  }

  label {
    margin-inline-end: 7px;
  }

  .input {
    display: none;

    ~.label {
      margin-inline-start: 8px;
    }

    &:checked~.slider {
      &::after {
        inset-inline-start: 32px - 24px + 8px;
      }
    }
  }

  .input:checked~.slider {
    &::after {
      background: var(--white);
      border: 1px solid var(--fade-grey);
    }
  }
}

.thin-switch-block {
  padding: 0px 0 !important;
  display: flex;
  align-items: center;

  .text {
    margin-inline-start: 16px;

    span {
      display: block;
      position: relative;
      color: var(--light-text);
    }
  }
}

.is-dark {
  .thin-switch {
    &.is-primary {
      .input:checked~.slider {
        background: var(--primary-light-20);

        &::after {
          background: var(--primary);
          border-color: var(--primary);
        }
      }
    }

    &.is-success {
      .input:checked~.slider {
        &::after {
          background: var(--success);
          border-color: var(--success);
        }
      }
    }

    &.is-info {
      .input:checked~.slider {
        &::after {
          background: var(--info);
          border-color: var(--info);
        }
      }
    }

    &.is-warning {
      .input:checked~.slider {
        &::after {
          background: var(--warning);
          border-color: var(--warning);
        }
      }
    }

    &.is-danger {
      .input:checked~.slider {
        &::after {
          background: var(--danger);
          border-color: var(--danger);
        }
      }
    }

    .slider {
      background: var(--dark-sidebar-light-55);

      &::after {
        background: var(--dark-sidebar-light-22);
      }
    }

    .input:checked~.slider {
      &::after {
        background: var(--dark-sidebar-light-55);
        border: var(--dark-sidebar-light-55);
      }
    }
  }
}


.is-small {
  .form-switch {
    /* Estilos para el tamaño pequeño */
  }

  .thin-switch {
    /* Estilos para el tamaño pequeño */
  }
}

.is-medium {
  @media screen and (max-width: 1768px) {
    .form-switch {
      i {
        width: 31px; // Tamaño para pantallas más pequeñas
        height: 12px; // Tamaño para pantallas más pequeñas

      }

      i::before {
        width: 22px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas

      }

      i::after {
        width: 10px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas
      }
    }

    .thin-switch {
      .slider {
        height: 5px; // Tamaño para pantallas más pequeñas
        margin: 0px;
        padding: 0px;
      }

      .slider::after {
        top: -4.5px; // Tamaño para pantallas más pequeñas
        width: 15px; // Tamaño para pantallas más pequeñas
        height: 15px; // Tamaño para pantallas más pequeñas
      }
    }





    .text {
      span {
        font-size: 0.6em; // Tamaño del texto ajustado para pantallas más pequeñas
      }
    }
  }

  @media screen and (max-width: 1508px) {
    .form-switch {
      i {
        width: 31px; // Tamaño para pantallas más pequeñas
        height: 12px; // Tamaño para pantallas más pequeñas

      }

      i::before {
        width: 22px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas

      }

      i::after {
        width: 10px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas
      }
    }

    .thin-switch {
      .slider {
        height: 5px; // Tamaño para pantallas más pequeñas
        margin: 0px;
        padding: 0px;
      }

      .slider::after {
        top: -4.5px; // Tamaño para pantallas más pequeñas
        width: 15px; // Tamaño para pantallas más pequeñas
        height: 15px; // Tamaño para pantallas más pequeñas
      }
    }





    .text {
      span {
        font-size: 0.5em; // Tamaño del texto ajustado para pantallas más pequeñas
      }
    }
  }
}

.is-large {
  .form-switch {
    i {
      width: 86px; // Tamaño para pantallas grandes
      height: 32px; // Tamaño para pantallas grandes
    }

    i::before {
      width: 62px; // Tamaño para pantallas grandes
      height: 28px; // Tamaño para pantallas grandes
    }

    i::after {

      width: 48px; // Tamaño para pantallas grandes
      height: 28px; // Tamaño para pantallas grandes
    }

    input {
      position: absolute;
      opacity: 0;
      pointer-events: none;

      &:checked+i {

        &::before {
          transform: translate3d(calc(var(--transform-direction) * 18px), 2px, 0) scale3d(0, 0, 0);
        }

        &::after {
          transform: translate3d(calc(var(--transform-direction) * 35px), 2px, 0);
        }
      }
    }
  }

  .thin-switch {
    .slider {
      height: 12px; // Tamaño para pantallas grandes
    }

    .slider::after {
      top: -12.5px; // Tamaño para pantallas grandes
      width: 36px; // Tamaño para pantallas grandes
      height: 36px; // Tamaño para pantallas grandes
    }
  }

  @media screen and (max-width: 1768px) {
    .form-switch {
      i {
        width: 40px; // Tamaño para pantallas más pequeñas
        height: 24px; // Tamaño para pantallas más pequeñas
      }

      i::before {
        width: 36px; // Tamaño para pantallas más pequeñas
        height: 20px; // Tamaño para pantallas más pequeñas
      }

      i::after {
        width: 20px; // Tamaño para pantallas más pequeñas
        height: 20px; // Tamaño para pantallas más pequeñas
      }
    }

    .thin-switch {
      .slider {
        height: 8px; // Tamaño para pantallas más pequeñas
      }

      .slider::after {
        top: -8.5px; // Tamaño para pantallas más pequeñas
        width: 24px; // Tamaño para pantallas más pequeñas
        height: 24px; // Tamaño para pantallas más pequeñas
      }
    }
  }

  @media screen and (max-width: 1508px) {
    .form-switch {
      i {
        width: 31px; // Tamaño para pantallas más pequeñas
        height: 12px; // Tamaño para pantallas más pequeñas
      }

      i::before {
        width: 22px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas

      }

      i::after {
        width: 10px; // Tamaño para pantallas más pequeñas
        height: 10px; // Tamaño para pantallas más pequeñas
      }
    }

    .thin-switch {
      .slider {
        height: 8px; // Tamaño para pantallas más pequeñas
      }

      .slider::after {
        top: -8.5px; // Tamaño para pantallas más pequeñas
        width: 24px; // Tamaño para pantallas más pequeñas
        height: 24px; // Tamaño para pantallas más pequeñas
      }
    }
  }
}
</style>
