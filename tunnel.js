const ngrok = require('ngrok');

async function startTunnel() {
  try {
    console.log('Starting ngrok tunnel to http://localhost:3000...');
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN // optional
    });
    console.log(`🚀 ngrok tunnel established!`);
    console.log(`🌐 Public URL: ${url}`);
    console.log(`📱 Local URL: http://localhost:3000`);
    console.log('');
    console.log('Press Ctrl+C to stop the tunnel');

    // Keep the process running
    process.stdin.resume();

    process.on('SIGINT', async () => {
      console.log('\n⏹️  Stopping ngrok tunnel...');
      await ngrok.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting ngrok:', error.message);
    process.exit(1);
  }
}

startTunnel();
