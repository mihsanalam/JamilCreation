declare module '@nozbe/with-observables' {
  export default function withObservables(
    triggerProps: string[],
    getObservables: (props: any) => any
  ): (Component: any) => any;
}
