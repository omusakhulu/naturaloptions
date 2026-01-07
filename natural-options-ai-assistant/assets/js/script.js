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
                    appendMessage('ai', data.response);
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
    });

    function appendMessage(role, text) {
        var $msg = $('<div class="no-ai-message"></div>').addClass('no-ai-' + role).text(text);
        $('#no-ai-messages').append($msg);
        var $body = $('#no-ai-chat-body');
        $body.scrollTop($body[0].scrollHeight);
    }
});
