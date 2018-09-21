# Official MegaOptim.com library for Node.js

This is official node.js client for working with the [MegaOptim.com](https://megaoptim.com) API.

The library implements the MegaOptim REST service for optimizing images. The library can be used in any project by installing with `npm` command.

## Installation

```
npm install megaoptim --save
```

## Getting Started

To start using the MegaOptim Image Optimization service you will need to obtain API key from [MegaOptim.com](https://megaoptim.com). Once  you have the key you will be able to start using the service immediately.

## How to use 

You can optimize your images in several ways. The api supports any of those: single url, single local file path, multiple urls, multiple local file paths.

Using the url/s approach is great for images that are already in production or any other place on the Internet. The direct upload method is ideal for your own galleries that aren't public, your deployment process, build script or the on-the-fly processing of your user's uploads where you don't have the images available online yet.

If you provide url/urls this library will pass them to the API server and the API server will download the contents. If you provide local path/paths the library will upload them in the initial request using HTTP Post.

The API currently accepts the following parameters:


| Parameter 	    | Possible Values               	                                        |
|-------------------|---------------------------------------------------------------------------|
| `compression`     | `lossy` or `lossless` (default: `lossy`)                                  |
| `type`        	| `url`, `urls`, `file`, `files`. `file/s` are local paths                  |
| `cmyktorgb`   	| `1` or `0` (default: `1`)                                                 |
| `keep_exif`   	| `1` or `0` (default: `0`)                                                 |
| `max_height`   	| `0` or `N` (default: `0` - disabled)                                      |
| `max_width`   	| `0` or `N` (default: `0` - disabled)                                      |
| `url`         	| Required if `type` is `url`                                               |
| `urlN`        	| Required if `type` is `urls`. Can be `url1`,`url2` up to 5.               |
| `file`        	| Required if `type` is `file`                                              |
| `fileN`       	| Required if `type` is `files`. Can be `file1`,`file2` up to 5.            |
| `callback_url`    | If specified the request results will be send to this url using HTTP POST |

**NOTE:** If `max_height` and `max_width` are specified the image will be resized to the bigger one of them keeping the ratio.

## Lossy Optimization
When you decide to sacrifice just a small amount of image quality (usually unnoticeable to the human eye), you will be able to save up to 90% of the initial file weight. Lossy optimization will give you outstanding results with just a fraction of image quality loss.


## Optimization / Fetching results

MegaOptim gives you with two ways to obtain the results of the optimization as follows: 
* Call `https://api.megaoptim.com/optimize/{process_id}/result?timeout=300` endpoint and wait for the result for the specified timeout.
* Provide `callback_url` parameter in your initial request and our servers will send the response to the callback by using HTTP POST.


### 1.) Using /result endpoint

In the following example `65bfc090-a2fc-11e8-ab19-ad2bb706c7e4` is unique `process_id` returned in the initial call. Using it you can query the results. Note that the `process_id` is `unique` for every request you send.

##### Request

Method `POST`, URL: `https://api.megaoptim.com/v1/optimize`

```
{
    type: 'url',
    url: 'https://someurl.com/1.jpg',
    compression: 'lossy'
}
```

##### Response

```json
{
    "status": "processing",
    "code": 202,
    "process_id": "65bfc090-a2fc-11e8-ab19-ad2bb706c7e4"
}
```

So now we have the `process_id`. We are one step closer to the results and you should send another request to obtain the result as follows:

##### Request

Method `POST`, URL: `https://api.megaoptim.com/v1/optimize/65bfc090-a2fc-11e8-ab19-ad2bb706c7e4/result?timeout=300`

##### Response

```json
{
    "status": "ok",
    "code": 200,
    "result": [
        {
            "file_name": "1.jpg",
            "original_size": 315615,
            "optimized_size": 127380,
            "saved_bytes": 188235,
            "saved_percent": 60,
            "url": "https://srv1.megaoptim.test/b12020cdf3a1/xmdobhRRl7tk6xd.png",
            "success": 1
        }
    ],
    "user": {
        "name": "John Doe",
        "email": "john@doe.com",
        "tokens": 474
    }
}
```


The `timeout` property is used to specify how much seconds to wait for the job to finish. Assuming that we specified `timeout` to be `120`, if the job finishes in less than `120` seconds then it will return the results of the job, otherwise the `status` of the response will stil be `processing`.


### 2.) Fetch: Using `callback_url` parameter

To receive the results using `callback_url` you should provide it in the initial `POST` call. Specify the `callback_url` with your url. Make sure you have the callback method implemented otherwise you will not be able to receive/process the results.

##### Request

Method `POST`, URL: `https://api.megaoptim.com/v1/optimize`

```
{
    type: 'url',
    url: 'https://someurl.com/1.jpg',
    compression: 'lossy',
    callback_url: 'https://my-awesome-website.com/megaoptim_callback'
}
```

##### Response

```json
{
    "status": "processing",
    "code": 202,
    "process_id": "65bfc090-a2fc-11e8-ab19-ad2bb706c7e4"
}
```

##### Results posted to the Callback URL

```json
{
    "status": "ok",
    "code": 200,
    "id": "65bfc090-a2fc-11e8-ab19-ad2bb706c7e4",
    "result": [
        {
            "file_name": "1.jpg",
            "original_size": 315615,
            "optimized_size": 127380,
            "saved_bytes": 188235,
            "saved_percent": 60,
            "url": "https://srv1.megaoptim.test/b12020cdf3a1/xmdobhRRl7tk6xd.png",
            "success": 1
        }
    ],
    "user": {
        "name": "John Doe",
        "email": "john@doe.com",
        "tokens": 474
    }
}
```

**NOTE:** The `callback_url` must be `public` and accessible by our servers. If by any reason our server fail to access it you can always query the result with using the `/result` endpoint described above.

## Usage

This library provides easy to use interface to utilize the MegaOptim API. In the following example we import megaoptim, make instance of the `MegaOptim` and then we call the `optimize` method.

The `optimize` method accepts 3 parameters and all are mandatory
* `resource` (`string`|`array`) - This can be local path or `array` that contains local paths, or url or `array` that contains urls. The `array` can be max up to 5 urls/paths.
* `params` (`dict`) - This object contains the API parameters in key:value based representation.
* `timeout` (`integer`) - This is the timeout to wait once the api request is sent. By default it is ignored if you provide `callback_url` in the `params`.
* `callback` (`function`) - This is where you receive the results.


**NOTE:** If you provide multiple images as `array` they either need to be all local paths or public urls. You can not mix those!

```javascript
var MegaOptim = require('megaoptim');

var client = new MegaOptim({
    api_key: '_YOUR API KEY_'
});

var source = 'https://awesome-website/image.jpg';

client.optimize(source, {}, 300, function (response) {
    if (response.status === 'processing') {
        // Still processing.
        // If callback_url has been passed the status will be processing
        // So you should handle the processing in your callback url.
    } else if (response.status === 'ok') {
        // Processing finished!
        // Results are there
        for (var i in response.result) {
            if (response.result.hasOwnProperty(i)) {
                console.log('Total saved: ' + response.result[i].saved_percent + '%');
                console.log('Download url: ' + response.result[i].url)
            }
        }
    } else if (response.status === 'error') {
        // If error happened you have an errors array with all the errors.
        for (var i in response.errors) {
            if (response.errors.hasOwnProperty(i)) {
                // Print errors or do something!
                console.log(response.errors[i])
            }
        }
    } else {
        // Unexpected error
    }
});
```

Depending on a choosen response option (Call /result endpoint or Callback URL) in the data object you will find either the optimization ID or optimization results containing a status property, file name, original file size, optimized file size, amount of savings and array of objects that contain optimized image URL:

```json
{
    "status": "ok",
    "code": 200,
    "result": [
        {
            "file_name": "1.png",
            "original_size": 315615,
            "optimized_size": 127380,
            "saved_bytes": 188235,
            "saved_percent": 60,
            "url": "https://srv1.megaoptim.test/b12020cdf3a1/xmdobhRRl7tk6xd.png",
            "success": 1
        },
        {
            "file_name": "2.png",
            "original_size": 3257509,
            "optimized_size": 1123807,
            "saved_bytes": 2133702,
            "saved_percent": 66,
            "url": "https://srv1.megaoptim.test/b12020cdf3a1/EYLp7KxBfgGt0Ly.png",
            "success": 1
        }
    ],
    "user": {
        "name": "John Doe",
        "email": "john@doe.com",
        "tokens": 1234
    }
}
```
For more examples please see the `examples/` directory.

## Contribution

Feel free to open pull request if you noticed any bug o want to propose improvement.

## Support

If you have any questions feel free to contact us at `support@megaoptim.com`

## License

```
Copyright (c) 2018 IDEOLOGIX MEDIA (https://ideologix.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

See LICENSE for more information.
```