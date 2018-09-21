var MegaOptim = require('megaoptim');

var client = new MegaOptim({
    api_key: '_YOUR_API_KEY_'
});

var source = 'https://awesome-website.com/image.jpg';

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

