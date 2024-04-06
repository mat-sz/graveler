import { JSDOM } from 'jsdom';

import {
  ArgTypes,
  DataType,
  InputTypes,
  NodeDefinition,
  OutputTypes,
} from '../types.js';

export const NODES: Record<string, NodeDefinition<any, any, any>> = {};

function defineNode<
  TArgTypes extends ArgTypes,
  TInputTypes extends InputTypes,
  TOutputTypes extends OutputTypes,
>(
  type: string,
  data: Omit<NodeDefinition<TArgTypes, TInputTypes, TOutputTypes>, 'type'>,
) {
  NODES[type] = { type, ...data };
}

defineNode('http.get', {
  label: 'HTTP GET',
  argTypes: {
    url: {
      label: 'URL',
      type: DataType.STRING,
      preview: true,
      required: true,
    },
  },
  outputTypes: {
    text: {
      label: 'Text',
      type: DataType.STRING,
    },
  },
  async run({ args }) {
    const res = await fetch(args.url);
    return {
      text: await res.text(),
    };
  },
});

defineNode('html.parse', {
  label: 'HTML: Parse',
  inputTypes: {
    text: {
      label: 'Text',
      type: DataType.STRING,
      required: true,
    },
  },
  outputTypes: {
    element: {
      label: 'Element',
      type: DataType.HTML_ELEMENT,
    },
  },
  async run({ inputs }) {
    const dom = new JSDOM(inputs.text);

    return {
      element: dom.window.document.documentElement,
    };
  },
});

defineNode('html.querySelector', {
  label: 'HTML: Query Selector',
  inputTypes: {
    element: {
      label: 'Element',
      type: DataType.HTML_ELEMENT,
      required: true,
    },
  },
  argTypes: {
    selector: {
      label: 'Selector',
      type: DataType.STRING,
      required: true,
    },
  },
  outputTypes: {
    element: {
      label: 'Element',
      type: DataType.HTML_ELEMENT,
    },
  },
  async run({ inputs, args }) {
    return {
      element: inputs.element.querySelector(args.selector)!,
    };
  },
});
