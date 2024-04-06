export enum DataType {
  STRING = 'string',
  HTML_ELEMENT = 'html_element',
}

export interface NodeArgument {
  type: DataType;
  label: string;
  preview?: boolean;
  required?: boolean;
}

export interface NodeInput {
  type: DataType;
  label: string;
  required?: boolean;
}

export interface NodeOutput {
  type: DataType;
  label: string;
}

export type ArgTypes = { [key: string]: NodeArgument };
export type InputTypes = { [key: string]: NodeInput };
export type OutputTypes = { [key: string]: NodeOutput };

export type TypesWithRequired = {
  [key: string]: { type: DataType; required?: boolean };
};

type MapType<T extends DataType> = T extends DataType.STRING
  ? string
  : T extends DataType.HTML_ELEMENT
    ? HTMLElement
    : any;

type MapTypes<T extends { [key: string]: { type: DataType } }> = {
  [key in keyof T]: MapType<T[key]['type']>;
};
type MapTypesWithRequired<T extends TypesWithRequired> = {
  [key in keyof T]:
    | MapType<T[key]['type']>
    | (T[key]['required'] extends true ? never : undefined);
};
type GetMandatoryKeys<T> = {
  [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never;
}[keyof T];
type MandatoryProps<T> = Pick<T, GetMandatoryKeys<T>>;
type OptionalMapTypes<
  T extends TypesWithRequired,
  TMap = MapTypesWithRequired<T>,
> = Partial<TMap> & MandatoryProps<TMap>;

export interface NodeType<
  TArgTypes extends ArgTypes = Record<string, NodeArgument>,
  TInputTypes extends InputTypes = Record<string, NodeInput>,
  TOutputTypes extends OutputTypes = Record<string, NodeOutput>,
> {
  type: string;
  label: string;
  argTypes?: TArgTypes;
  inputTypes?: TInputTypes;
  outputTypes?: TOutputTypes;
}

export interface NodeDefinition<
  TArgTypes extends ArgTypes,
  TInputTypes extends InputTypes,
  TOutputTypes extends OutputTypes,
> extends NodeType<TArgTypes, TInputTypes, TOutputTypes> {
  run(context: {
    args: OptionalMapTypes<TArgTypes>;
    inputs: OptionalMapTypes<TInputTypes>;
  }): Promise<MapTypes<TOutputTypes>>;
}

export interface NodeData {
  type: string;
  args: Record<string, any>;
}

export interface Node {
  id: string;
  data: NodeData;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Flow {
  nodes: Node[];
  edges: Edge[];
}
