const dgram = require( 'dgram' );

const bp = require( 'bufferpack' );

class SourceQuery {
    constructor( localInterface = '0.0.0.0' ) {
        this.client = dgram.createSocket( 'udp4' );

        this.client.bind( 0, localInterface );
    }

    async send( buffer, address, port, code, timeout = 1000 ) {
        if( !buffer || !( buffer instanceof Buffer ) ) throw new Error( 'Missing/Invalid param \'buffer\'' );
        if( !address || typeof address !== 'string' ) throw Error( 'Missing/Invalid param \'address\'' );
        if( !port || typeof port !== 'number' ) throw new Error( 'Missing/Invalid param \'port\'' );
        if( !code || typeof code !== 'string' ) throw new Error( 'Missing/Invalid param \'code\'' );
        if( typeof timeout !== 'number' ) throw new Error( 'Invalid Param \'timeout\'' );

        return new Promise( ( resolve, reject ) => {
            this.client.send( buffer, 0, buffer.length, port, address, ( err, bytes ) => {
                if( err ) throw( typeof err === 'string' ? new Error( err ) : err );

                const response = ( bufferResponse, remote ) => {
                    // Any unmatched parameter will return rather than error so that multiple requests can be made at once.
                    if( remote.address !== address ) return;
                    if( remote.port !== port ) return;
                    if( bufferResponse.length < 1 ) return;

                    const bufferClear = bufferResponse.slice( '4' );
                    
                    if( bp.unpack( '<s', bufferClear )[ 0 ] !== code ) return;
                    
                    this.client.removeListener( 'message', response );
                    
                    clearTimeout( time );
                    
                    return resolve( bufferClear.slice( 1 ) );
                };

                let time = setTimeout( () => {
                    this.client.removeListener( 'message', response );

                    reject( 'Connection timed out.' );
                }, timeout );

                this.client.on( 'message', response );
            } )
        } );
    }

    async challenge( address, port, code, timeout = 1000 ) {
        if( !address || typeof address !== 'string' ) return new Error( 'Missing/Invalid param \'address\'' );
        if( !port || typeof port !== 'number' ) return new Error( 'Missing/Invalid param \'port\'' );
        if( !code || typeof code !== 'string' ) return new Error( 'Missing/Invalid param \'code\'' );
        if( typeof timeout !== 'number' ) return new Error( 'Invalid Param \'timeout\'' );

        let buffer = await this.send( bp.pack( '<isi', [ -1, code, -1 ] ), address, port, 'A', timeout );

        return bp.unpack( '<i', buffer )[ 0 ];
    }

    async info( address, port, timeout = 1000 ) {
        if( !address || typeof address !== 'string' ) return new Error( 'Missing/Invalid param \'address\'' );
        if( !port || typeof port !== 'number' ) return new Error( 'Missing/Invalid param \'port\'' );
        if( typeof timeout !== 'number' ) return new Error( 'Invalid Param \'timeout\'' );

        let buffer = await this.send( bp.pack( '<isS', [ -1, 'T', 'Source Engine Query' ] ), address, port, 'I', timeout );

        const list = bp.unpack( '<bSSSShBBBssBB', buffer );
        const keys = [ 'protocol', 'name', 'map', 'folder', 'game', 'appid', 'playersnum', 'maxplayers', 'botsnum', 'servertype', 'environment', 'visibility', 'vac' ];
        const info = {};

        for( let i = 0; i < list.length; i++ ) {
            info[ keys[ i ] ] = list[ i ];
        }

        buffer = buffer.slice( bp.calcLength( '<bSSSShBBBssBB', list ) );
        info.version = bp.unpack( '<S', buffer )[ 0 ];
        buffer = buffer.slice( bp.calcLength( '<S', [ info.version ] ) );

        if( buffer.length > 1 ) {
            let offset = 0;
            const EDF = bp.unpack( '<b', buffer )[ 0 ];
            offset += 1;
            if( ( EDF & 0x80 ) !== 0 ) {
                info.port = bp.unpack( '<h', buffer, offset )[ 0 ];
                offset += 2;
            }
            if( ( EDF & 0x10 ) !== 0 ) {
                info.steamID = bp.unpack( '<ii', buffer, offset )[ 0 ];
                offset += 8;
            }
            if( ( EDF & 0x40 ) !== 0 ) {
                let tvinfo = bp.unpack( '<hS', buffer, offset );
                info[ 'tv-port' ] = tvinfo[ 0 ];
                info[ 'tv-name' ] = tvinfo[ 1 ];
                offset += bp.calcLength( '<hS', tvinfo );
            }
            if( ( EDF & 0x20 ) !== 0 ) {
                info.keywords = bp.unpack( '<S', buffer, offset )[ 0 ];
                offset += bp.calcLength( '<S', info.keywords );
            }
            if( ( EDF & 0x01 ) !== 0 ) {
                info.gameID = bp.unpack( '<i', buffer, offset )[ 0 ];
                offset += 4;
            }
        }

        return info;
    }

    async players( address, port, timeout = 1000 ) {
        if( !address || typeof address !== 'string' ) return new Error( 'Missing/Invalid param \'address\'' );
        if( !port || typeof port !== 'number' ) return new Error( 'Missing/Invalid param \'port\'' );
        if( typeof timeout !== 'number' ) return new Error( 'Invalid Param \'timeout\'' );

        let key = await this.challenge( address, port, 'U', timeout );

        let buffer = await this.send( bp.pack( '<isi', [ -1, 'U', key ] ), address, port, 'D', timeout );

        let count = bp.unpack( '<B', buffer )[ 0 ];
        let offset = 1;
        let players = [];
        let keys = [ 'index', 'name', 'score', 'duration' ];
        for( let i = 0; i < count; i++ ) {
            let list = bp.unpack( '<bSif', buffer, offset );
            let player = {};
            for( let i = 0; i < list.length; i++ ) {
                player[ keys[ i ] ] = list[ i ];
            }
            offset += bp.calcLength( '<bSif', list );
            players.push( player );
        }

        return players;
    }

    async rules( address, port, timeout = 1000 ) {
        if( !address || typeof address !== 'string' ) return new Error( 'Missing/Invalid param \'address\'' );
        if( !port || typeof port !== 'number' ) return new Error( 'Missing/Invalid param \'port\'' );
        if( typeof timeout !== 'number' ) return new Error( 'Invalid Param \'timeout\'' );

        let key = await this.challenge( address, port, 'V', timeout );

        let buffer = await this.send( bp.pack( '<isi', [ -1, 'V', key ] ), address, port, 'E', timeout );

        const count = bp.unpack( '<h', buffer )[ 0 ];
        const rules = [];
        let keys = [ 'name', 'value' ];
        let offset = 2;
        for( let i = 0; i < count; i++ ) {
            let list = bp.unpack( '<SS', buffer, offset );
            let rule = {};
            for( let i = 0; i < list.length; i++ ) {
                rule[ keys[ i ] ] = list[ i ];
            }
            rules.push( rule );
            offset += bp.calcLength( '<SS', list );
        }

        return rules;
    }

    destroy() {
        this.client.close();
    }
}

module.exports = SourceQuery;
