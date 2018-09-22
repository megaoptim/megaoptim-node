/**
 * Copyright (c) 2018 IDEOLOGIX MEDIA (https://ideologix.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * See LICENSE for more information.
 */

'use strict';

/**
 * Globals
 */
var fs = require("fs"),
    stream = require("stream"),
    request = require("request");

/**
 * Configuration
 * @param object params
 */
var MegaOptim = module.exports = function (params) {
    this.api_key = params.api_key;
    this.api_base_url = 'https://api.megaoptim.com/v1/';
    this.api_optimize_url = this.api_base_url + 'optimize';
    this.api_user_agent = 'MegaOptim Node.js Client v1.0.0';
    this.api_headers = {'User-Agent': this.api_user_agent, 'X-API-KEY': this.api_key};
};


/**
 * Creates a http response handler
 *
 * @param {Function} cb
 */
MegaOptim.prototype.handleResponse = function (cb) {
    return function (err, res, body) {
        if (err) {
            return cb(err);
        }
        try {
            body = JSON.parse(body);
            return cb(body);
        } catch (e) {
            console.log(e.message);
            return cb({status: "error", errors: ['Failed to parse JSON response.']});
        }
    }
};


/**
 * Set default key:val if it doesn't exist in the parameters array
 * @param key
 * @param value
 * @param params
 * @returns {*}
 */
MegaOptim.prototype.maybe_set_default = function (key, value, params) {
    if (!(key in params)) {
        params[key] = value;
    }
    return params;
};

/**
 * Validates url
 * @param url
 * @returns {boolean}
 */
MegaOptim.prototype.validate_url = function (url) {
    var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return res != null;
};

/**
 * Validates given file if exists
 * @param file
 * @returns {boolean}
 */
MegaOptim.prototype.validate_file = function (file) {
    if (file instanceof stream.Stream) {
        return true;
    }
    return fs.existsSync(file);
};

/**
 * Check if the given only array contains urls.
 * @param resource
 * @returns {boolean}
 */
MegaOptim.prototype.contains_valid_urls = function (resource) {
    for (var i in resource) {
        if (resource.hasOwnProperty(i)) {
            if (!this.validate_url(resource[i])) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Check if the given only array contains local paths.
 * @param resource
 * @returns {boolean}
 */
MegaOptim.prototype.contains_valid_file_paths = function (resource) {
    for (var i in resource) {
        if (resource.hasOwnProperty(i)) {
            if (!this.validate_file(resource[i])) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Create POST request to the MegaOptim server
 * @param resource
 * @param params
 * @param cb
 */
MegaOptim.prototype.send = function (resource, params, cb) {
    params = params || {};

    var help = 'Invalid resouce type. Resource must be valid image. Also it should any of the following: ';
    help += 'image url, local image path, tuple of up to 5 image urls or tuple of up to 5 local image paths.';

    params = this.maybe_set_default('compression', 'intelligent', params);
    params = this.maybe_set_default('keep_exif', '1', params);
    params = this.maybe_set_default('cmyktorgb', '1', params);
    params = this.maybe_set_default('max_width', '0', params);
    params = this.maybe_set_default('max_height', '0', params);

    var valid_files;
    var valid_urls;
    if (Array.isArray(resource)) {
        valid_files = false;
        valid_urls = this.contains_valid_urls(resource);
        if (!valid_urls) {
            valid_files = this.contains_valid_file_paths(resource);
        }
        var i;
        if (valid_urls) {
            params['type'] = 'urls';
            for (i = 0; i < resource.length; i++) {
                params['url' + (i + 1)] = resource[i];
            }
        } else if (valid_files) {
            params['type'] = 'files';
            for (i = 0; i < resource.length; i++) {
                if (resource[i] instanceof stream.Stream) {
                    params['file' + (i + 1)] = resource[i];
                } else {
                    params['file' + (i + 1)] = fs.createReadStream(resource[i]);
                }
            }
        } else {
            throw Error(help);
        }
    } else {
        if (this.validate_url(resource)) {
            params['type'] = 'url';
            params['url'] = resource;
        } else if (this.validate_file(resource)) {
            params['type'] = 'file';
            if (resource instanceof stream.Stream) {
                params['file'] = resource;
            } else {
                params['file'] = fs.createReadStream(resource);
            }
        } else {
            throw Error(help);
        }
    }
    request.post({
        url: this.api_optimize_url,
        formData: params,
        method: 'POST',
        headers: this.api_headers
    }, this.handleResponse(cb));
};

/**
 * Initiates a API call to check the result and will wait for a given timeout.
 * @param process_id
 * @param timeout
 * @param cb
 */
MegaOptim.prototype.get_result = function (process_id, timeout, cb) {
    request.post({
        url: this.api_optimize_url + '/' + process_id + '/result?timeout' + timeout,
        headers: this.api_headers,
        method: 'POST'
    }, this.handleResponse(cb));
};

/**
 * Optimize images
 * @param resource ( array or string )
 * @param params ( the api params )
 * @param timeout ( timeout in seconds )
 * @param cb (the callback)
 */
MegaOptim.prototype.optimize = function (resource, params, timeout, cb) {
    var self = this;
    this.send(resource, params, function (response) {
        if (response.status === 'processing' && !params.hasOwnProperty('callback_url')) {
            self.get_result(response.process_id, timeout, cb);
        } else {
            cb(response);
        }
    });
};