"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceQuerySocket = void 0;
const dgram_1 = __importDefault(require("dgram"));
class SourceQuerySocket {
    constructor(options = {}) {
        this.close = () => {
            var _a;
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
            this.socket = undefined;
        };
        this.info = (address, port, timeout = 1000) => __awaiter(this, void 0, void 0, function* () {
            const query = yield this.solicit({ address, port: parseInt(port, 10), family: '' }, 'T', 'Source Engine Query', timeout);
            const result = {};
            let offset = 4;
            result.header = query.slice(offset, offset + 1);
            offset += 1;
            result.header = result.header.toString();
            if (result.header === 'm') {
                // GoldSource server response parsing
                result.address = query.slice(offset, query.indexOf(0, offset));
                offset += result.address.length + 1;
                result.address = result.address.toString();
                result.name = query.slice(offset, query.indexOf(0, offset));
                offset += result.name.length + 1;
                result.name = result.name.toString();
                result.map = query.slice(offset, query.indexOf(0, offset));
                offset += result.map.length + 1;
                result.map = result.map.toString();
                result.folder = query.slice(offset, query.indexOf(0, offset));
                offset += result.folder.length + 1;
                result.folder = result.folder.toString();
                result.game = query.slice(offset, query.indexOf(0, offset));
                offset += result.game.length + 1;
                result.game = result.game.toString();
                result.players = query.readInt8(offset);
                offset += 1;
                result.maxPlayers = query.readInt8(offset);
                offset += 1;
                result.protocol = query.readInt8(offset);
                offset += 1;
                result.serverType = String.fromCharCode(query.readInt8(offset));
                offset += 1;
                result.environment = String.fromCharCode(query.readInt8(offset));
                offset += 1;
                result.visibility = query.readInt8(offset);
                offset += 1;
                result.mod = query.readInt8(offset);
                offset += 1;
                if (result.mod === 1) {
                    // Parse mod specific details
                    result.modLink = query.slice(offset, query.indexOf(0, offset));
                    offset += result.modLink.length + 1;
                    result.modLink = result.modLink.toString();
                    result.modDownloadLink = query.slice(offset, query.indexOf(0, offset));
                    offset += result.modDownloadLink.length + 1;
                    result.modDownloadLink = result.modDownloadLink.toString();
                    offset += 1; // Skip NULL byte
                    result.modVersion = query.readInt32LE(offset);
                    offset += 4;
                    result.modSize = query.readInt32LE(offset);
                    offset += 4;
                    result.modType = query.readInt8(offset);
                    offset += 1;
                    result.modDLL = query.readInt8(offset);
                    offset += 1;
                }
                result.vac = query.readInt8(offset);
                offset += 1;
                result.bots = query.readInt8(offset);
                offset += 1;
            }
            else {
                result.protocol = query.readInt8(offset);
                offset += 1;
                result.name = query.slice(offset, query.indexOf(0, offset));
                offset += result.name.length + 1;
                result.name = result.name.toString();
                result.map = query.slice(offset, query.indexOf(0, offset));
                offset += result.map.length + 1;
                result.map = result.map.toString();
                result.folder = query.slice(offset, query.indexOf(0, offset));
                offset += result.folder.length + 1;
                result.folder = result.folder.toString();
                result.game = query.slice(offset, query.indexOf(0, offset));
                offset += result.game.length + 1;
                result.game = result.game.toString();
                result.id = query.readInt16LE(offset);
                offset += 2;
                result.players = query.readInt8(offset);
                offset += 1;
                result.max_players = query.readInt8(offset);
                offset += 1;
                result.bots = query.readInt8(offset);
                offset += 1;
                result.server_type = query.slice(offset, offset + 1).toString();
                offset += 1;
                result.environment = query.slice(offset, offset + 1).toString();
                offset += 1;
                result.visibility = query.readInt8(offset);
                offset += 1;
                result.vac = query.readInt8(offset);
                offset += 1;
                result.version = query.slice(offset, query.indexOf(0, offset));
                offset += result.version.length + 1;
                result.version = result.version.toString();
                const extra = query.slice(offset);
                offset = 0;
                if (extra.length < 1)
                    return result;
                const edf = extra.readInt8(offset);
                offset += 1;
                if (edf & 0x80) {
                    result.port = extra.readInt16LE(offset);
                    offset += 2;
                }
                if (edf & 0x10) {
                    result.steamid = extra.readBigUInt64LE(offset);
                    offset += 8;
                }
                if (edf & 0x40) {
                    result.tvport = extra.readInt16LE(offset);
                    offset += 2;
                    result.tvname = extra.slice(offset, extra.indexOf(0, offset));
                    offset += result.tvname.length + 1;
                    result.tvname = result.tvname.toString();
                }
                if (edf & 0x20) {
                    const keywords = extra.slice(offset, extra.indexOf(0, offset));
                    offset += keywords.length + 1;
                    result.keywords = keywords.toString();
                }
                if (edf & 0x01) {
                    result.gameid = extra.readBigUInt64LE(offset);
                    offset += 8;
                }
            }
            return result;
        });
        this.players = (address, port, timeout = 1000) => __awaiter(this, void 0, void 0, function* () {
            const query = yield this.solicit({ address, port: parseInt(port, 10), family: '' }, 'U', undefined, timeout);
            let offset = 5;
            const count = query.readInt8(offset);
            offset += 1;
            const result = [];
            for (let i = 0; i < count; i += 1) {
                const player = {};
                player.index = query.readInt8(offset);
                offset += 1;
                player.name = query.slice(offset, query.indexOf(0, offset));
                offset += player.name.length + 1;
                player.name = player.name.toString();
                player.score = query.readInt32LE(offset);
                offset += 4;
                player.duration = query.readFloatLE(offset);
                offset += 4;
                result.push(player);
            }
            return result;
        });
        this.rules = (address, port, timeout = 1000) => __awaiter(this, void 0, void 0, function* () {
            const query = yield this.solicit({ address, port: parseInt(port, 10), family: '' }, 'V', undefined, timeout);
            let offset = 0;
            const header = query.readInt32LE(offset);
            if (header === -2)
                throw new Error('Unsupported response received.');
            offset += 4;
            offset += 1;
            const count = query.readInt16LE(offset);
            offset += 2;
            const result = [];
            for (let i = 0; i < count; i += 1) {
                const rule = {};
                rule.name = query.slice(offset, query.indexOf(0, offset));
                offset += rule.name.length + 1;
                rule.name = rule.name.toString();
                rule.value = query.slice(offset, query.indexOf(0, offset));
                offset += rule.value.length + 1;
                rule.value = rule.value.toString();
                result.push(rule);
            }
            return result;
        });
        if (options.port !== undefined)
            this.port = options.port;
        if (options.address !== undefined)
            this.address = options.address;
        if (options.exclusive !== undefined)
            this.exclusive = options.exclusive;
        if (options.fd !== undefined)
            this.fd = options.fd;
    }
    bind() {
        return new Promise((resolve, reject) => {
            const error = (err) => {
                var _a;
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
                return reject(err);
            };
            const listening = () => {
                var _a;
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.removeListener('error', error);
                return resolve();
            };
            this.socket = dgram_1.default.createSocket('udp4');
            this.socket.once('error', error);
            this.socket.once('listening', listening);
            this.socket.bind({ port: this.port, address: this.address, exclusive: this.exclusive, fd: this.fd });
        });
    }
    assert() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.socket === undefined) {
                try {
                    yield this.bind();
                }
                catch (err) {
                    return reject(err);
                }
                return resolve();
            }
            try {
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.address();
            }
            catch (err) {
                return (_b = this.socket) === null || _b === void 0 ? void 0 : _b.once('listening', () => resolve());
            }
            return resolve();
        }));
    }
    validate(einfo, rinfo) {
        if (rinfo.port !== einfo.port)
            return false;
        if (rinfo.address !== einfo.address)
            return false;
        return true;
    }
    send(einfo, request, duration) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                yield this.assert();
            }
            catch (err) {
                return reject(err);
            }
            let timeout;
            const message = (response, rinfo) => {
                var _a, _b;
                if (this.validate(einfo, rinfo) === false)
                    return;
                clearTimeout(timeout);
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.removeListener('message', message);
                if (((_b = this.socket) === null || _b === void 0 ? void 0 : _b.listenerCount('message')) === 0)
                    this.close();
                return resolve(response);
            };
            timeout = setTimeout(() => {
                var _a;
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.removeListener('message', message);
                return reject(new Error(`Request timed out. [${duration}ms]`));
            }, duration);
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.on('message', message);
            (_b = this.socket) === null || _b === void 0 ? void 0 : _b.send(request, einfo.port, einfo.address, (err) => {
                if (err !== undefined && err !== null)
                    return reject(err);
            });
        }));
    }
    pack(header, payload, challenge) {
        const preamble = Buffer.alloc(4);
        preamble.writeInt32LE(-1, 0);
        const request = Buffer.from(header);
        const data = payload ? Buffer.concat([Buffer.from(payload), Buffer.alloc(1)]) : Buffer.alloc(0);
        let prologue = Buffer.alloc(0);
        if (challenge !== undefined) {
            prologue = Buffer.alloc(4);
            prologue.writeInt32LE(challenge);
        }
        return Buffer.concat([preamble, request, data, prologue, preamble]);
    }
    solicit(einfo, header, payload, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this.pack(header, payload);
            const challenge = yield this.send(einfo, request, duration);
            const type = challenge.slice(4, 5).toString();
            if (type === 'A') {
                const result = this.pack(header, payload, challenge.readInt32LE(5));
                return this.send(einfo, result, duration);
            }
            return challenge;
        });
    }
}
exports.SourceQuerySocket = SourceQuerySocket;
exports.default = new SourceQuerySocket();
