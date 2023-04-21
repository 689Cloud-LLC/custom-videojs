// var arrayBufferToString = function arrayBufferToString( buffer, encoding, callback ) {
//   var blob = new Blob([buffer],{type:'text/plain'});
//   var reader = new FileReader();
//   reader.onload = function(evt){callback(evt.target.result);};
//   reader.readAsText(blob, encoding);
// }
//
// var stringToArrayBuffer = function stringToArrayBuffer( string, encoding, callback ) {
//   var blob = new Blob([string],{type:'text/plain;charset='+encoding});
//   var reader = new FileReader();
//   reader.onload = function(evt){callback(evt.target.result);};
//   reader.readAsArrayBuffer(blob);
// }

var _base64ToArrayBuffer = function _base64ToArrayBuffer(string) {
    var binary_string = window.atob(string);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

var decryptKeyFile = function decryptKeyFile(encryptedBytes, callback) {

    // a string
    const key = "urEyxMazRdsCI+AkPcGbaw==";
    const pwUtf8 = _base64ToArrayBuffer(key);
    console.log('pwUtf8', pwUtf8);

    const iv = pwUtf8;

    return crypto.subtle.importKey('raw', pwUtf8, {name: "AES-CBC"}, false, ['decrypt'])
        .then(function (key) {
            //returns the symmetric key
            console.log('key', key);

            return crypto.subtle.decrypt({name: "AES-CBC", iv}, key, encryptedBytes)
                .then(function (decrypted) {
                    console.log('decryptKeyFile', decrypted);
                    return callback(decrypted);
                })
                .catch(function (err) {
                    console.error(err);
                });
        }).catch(function (err) {
            console.error(err);
        });

}

/**
 * Handle responses for key data and convert the key data to the correct format
 * for the decryption step later
 *
 * @param {Object} segment - a simplified copy of the segmentInfo object
 *                           from SegmentLoader
 * @param {Array} objects - objects to add the key bytes to.
 * @param {Function} finishProcessingFn - a callback to execute to continue processing
 *                                        this request
 */


// var handleKeyResponse = function handleKeyResponse(segment, objects, finishProcessingFn) {
//     return function (error, request) {
//
//         console.log('handleKeyResponse', request.response)
//
//         var errorObj = handleErrors(error, request);
//
//         if (errorObj) {
//             return finishProcessingFn(errorObj, segment);
//         }
//
//         if (request.response.byteLength === 32) {
//
//             decryptKeyFile(request.response, function(response){
//
//                 if (response.byteLength !== 16) {
//                     return finishProcessingFn({
//                         status: request.status,
//                         message: 'Invalid HLS key at URL: ' + request.uri,
//                         code: REQUEST_ERRORS.FAILURE,
//                         xhr: request
//                     }, segment);
//                 }
//
//                 var decode = String.fromCharCode.apply(null, new Uint8Array(response));
//                 var deContent = btoa(decode);
//                 console.log("deContent: ", deContent);
//
//                 var decode16 = String.fromCharCode.apply(null, new Uint16Array(response));
//                 console.log('decode16', decode16);
//
//                 var buf = new ArrayBuffer(decode16.length * 2); // 2 bytes for each char
//                 var bufView = new Uint16Array(buf);
//                 for (var i = 0, strLen = decode16.length; i < strLen; i++) {
//                     bufView[i] = decode16.charCodeAt(i);
//                 }
//                 console.log("buf ", buf);
//
//                 response = buf;
//
//                 var view = new DataView(response);
//                 var bytes = new Uint32Array([view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)]);
//
//                 for (var i = 0; i < objects.length; i++) {
//                     objects[i].bytes = bytes;
//                 }
//
//                 return finishProcessingFn(null, segment);
//             });
//         }
//
//         if (request.response.byteLength === 16) {
//
//             var response = request.response;
//
//
//             var decode = String.fromCharCode.apply(null, new Uint8Array(response));
//             var deContent = btoa(decode);
//             console.log("deContent: ", deContent);
//
//             var decode16 = String.fromCharCode.apply(null, new Uint16Array(response));
//             console.log('decode16', decode16);
//
//             var buf = new ArrayBuffer(decode16.length * 2); // 2 bytes for each char
//             var bufView = new Uint16Array(buf);
//             for (var i = 0, strLen = decode16.length; i < strLen; i++) {
//                 bufView[i] = decode16.charCodeAt(i);
//             }
//             console.log("buf ", buf);
//
//             response = buf;
//
//             var view = new DataView(response);
//             var bytes = new Uint32Array([view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)]);
//
//             for (var i = 0; i < objects.length; i++) {
//                 objects[i].bytes = bytes;
//             }
//
//             return finishProcessingFn(null, segment);
//         }
//
//     };
// };

export default decryptKeyFile;
