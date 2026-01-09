jQuery(document).ready(function($) {
    var history = [];

    $('#no-ai-launcher').on('click', function() {
        $('#no-ai-widget').removeClass('no-ai-closed');
        $(this).hide();
    });

    $('#no-ai-toggle').on('click', function() {
        $('#no-ai-widget').addClass('no-ai-closed');
        $('#no-ai-launcher').show();
    });

    $('#no-ai-input-area').on('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });

    // Microphone / Speech Recognition
    var recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            $('#no-ai-mic').addClass('no-ai-listening');
            $('#no-ai-input').attr('placeholder', 'Listening...');
        };

        recognition.onresult = function(event) {
            var transcript = event.results[0][0].transcript;
            $('#no-ai-input').val(transcript);
            sendMessage();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopListening();
        };

        recognition.onend = function() {
            stopListening();
        };
    } else {
        $('#no-ai-mic').hide(); // Hide if not supported
    }

    $('#no-ai-mic').on('click', function() {
        if ($(this).hasClass('no-ai-listening')) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error('Recognition already started');
            }
        }
    });

    function stopListening() {
        $('#no-ai-mic').removeClass('no-ai-listening');
        $('#no-ai-input').attr('placeholder', 'Ask something...');
    }

    function sendMessage() {
        var message = $('#no-ai-input').val().trim();
        if (!message) return;

        appendMessage('user', message);
        $('#no-ai-input').val('');
        $('#no-ai-loading').show();

        $.ajax({
            url: noAiSettings.apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                message: message,
                history: history
            }),
            success: function(data) {
                $('#no-ai-loading').hide();
                if (data.response) {
                    var responseText = data.response;
                    
                    // Check for [ADD_TO_CART:ID] tag
                    var cartMatch = responseText.match(/\[ADD_TO_CART:(\d+)\]/);
                    if (cartMatch) {
                        var productId = cartMatch[1];
                        responseText = responseText.replace(/\[ADD_TO_CART:\d+\]/, ''); 
                        addToCart(productId);
                    }

                    // Check for [REQUEST_QUOTE:ID1*QTY1,ID2*QTY2,...:EMAIL] tag
                    var quoteMatch = responseText.match(/\[REQUEST_QUOTE:([^:]+):([^\]]+)\]/);
                    if (quoteMatch) {
                        var itemsRaw = quoteMatch[1].split(',');
                        var email = quoteMatch[2];
                        var items = itemsRaw.map(function(item) {
                            var parts = item.split('*');
                            return {
                                product_id: parts[0],
                                quantity: parts[1] || 1
                            };
                        });
                        responseText = responseText.replace(/\[REQUEST_QUOTE:[^\]]+\]/, '');
                        requestQuote(items, email);
                    }

                    appendMessage('ai', responseText);
                    history.push({
                        role: 'user',
                        parts: [{ text: message }]
                    });
                    history.push({
                        role: 'model',
                        parts: [{ text: data.response }]
                    });
                }
            },
            error: function(xhr) {
                $('#no-ai-loading').hide();
                var errorMsg = 'Sorry, something went wrong.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                appendMessage('ai', errorMsg);
            }
        });
    }

    function appendMessage(role, text) {
        var $msg = $('<div class="no-ai-message"></div>').addClass('no-ai-' + role).text(text);
        $('#no-ai-messages').append($msg);
        var $body = $('#no-ai-chat-body');
        $body.scrollTop($body[0].scrollHeight);
    }

    function addToCart(productId) {
        $.ajax({
            url: noAiSettings.cartUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                product_id: productId
            }),
            success: function(data) {
                if (data.success) {
                    appendMessage('ai', 'Success! I\'ve added that to your cart. You can view it here: ' + data.cart_url);
                }
            },
            error: function() {
                appendMessage('ai', 'I encountered an error trying to add that to your cart. Please try adding it manually.');
            }
        });
    }

    function requestQuote(items, email) {
        $.ajax({
            url: noAiSettings.quoteUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                items: items,
                email: email
            }),
            success: function(data) {
                if (data.success) {
                    var itemsList = data.items.join(', ');
                    var totalMessage = 'Quote for: ' + itemsList + '\nTotal: ' + data.total;
                    appendMessage('ai', 'Done! I have generated a quote/invoice and sent it to ' + email + '.\n\n' + totalMessage + '\n(Order #' + data.order_id + ')');
                }
            },
            error: function(xhr) {
                var errorMsg = 'I encountered an error trying to generate your quote. Please try again later.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                appendMessage('ai', errorMsg);
            }
        });
    }
});
