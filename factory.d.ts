export interface IPayload<T> {
    id: number,
    command: string,
    data: T,
    reply: boolean
}


export interface IMessager {
    bind<P, T>(name: string): (...args: P) => Promise<T>
    define(name: string, callback: Function): void
    listener(data: any): any
    ready(): void
    fn: any
    addEventListener(name: string, callback: (params: IPayload<any>) => void)
    removeEventListener(name: string, callback: (params: IPayload<any>) => void)
    isConnect(): boolean
}

export default function createMessager(sendHandler: (data: any) => void): IMessager