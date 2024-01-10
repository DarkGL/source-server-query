/// <reference types="node" />
import { BindOptions } from 'dgram';
export declare class SourceQuerySocket {
    port?: number;
    address?: string;
    exclusive?: boolean;
    fd?: number;
    private socket?;
    constructor(options?: BindOptions);
    private bind;
    private assert;
    private close;
    private validate;
    private send;
    private pack;
    private solicit;
    info: (address: string, port: number | string, timeout?: number) => Promise<Record<string, any>>;
    players: (address: string, port: number | string, timeout?: number) => Promise<Record<string, string | number>[]>;
    rules: (address: string, port: string | number, timeout?: number) => Promise<Record<string, string>[]>;
    private readCString;
}
declare const _default: SourceQuerySocket;
export default _default;
