const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
var volume = 1;

client.on('ready', () => {
	client.user.setActivity('Self-sustain mode.');
	console.log("Ready to serve.")
});

client.on('message', message => {
	//if not in server
	if (!message.guild) return;

	//if scanning own message
	if(message.author.bot) return;

	//if not starting with prefix
	if(message.content.indexOf(config.prefix) !== 0) return;

	//format command
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (command === 'info' || command === 'i') {
		var greeting = 'Hello, Lucency member. My name is Freya. I will be serving you for the time being.\n\nI am not a complex system. I can play music, and I am sentient. Do not ask more of me.';
		var dataIntro = 'Speak to me in the cli channel. My commands are:';
		var data = '_+info_ - I will provide this same information message.\n_+play [link]_ - I will join your voicechannel and play the audio you\'ve linked.\n_+volume [0-1]_ - I will set the playback volume.\n_+leave_ - I will leave your voice channel.';
		var extra = 'You may also use shorthand for these commands by simply typing the first letter. For example, `+v 0.5` sets the volume to half.';
		message.channel.send(greeting + '\n\n' + dataIntro + '\n\n' + data + '\n\n' + extra);
	}

	//control volume
	if (command === 'volume' || command === 'v') {
		if (parseFloat(args[0]) > 1) {
			volume = 1;
			message.channel.send('Setting volume to ' + volume + '. Please provide a value between 0 and 1.');
		} else if (parseFloat(args[0]) < 0) {
			volume = 0;
			message.channel.send('Setting volume to ' + volume + '. Please provide a value between 0 and 1.');
		} else {
			volume = parseFloat(args[0]);
			message.channel.send('Setting volume to ' + volume + '.');
		}
	}

	//leave channel
	if (command === 'leave' || command === 'l') {
		if (message.member.voiceChannel) message.member.voiceChannel.leave();
	}

	//play audio
	if (command === 'play' || command === 'p') {
		if (message.member.voiceChannel) {
			
			var inChannel = false;

			//check if already connected to channel
			if (client.voiceConnections.get(config.server)) {
				if (client.voiceConnections.get(config.server).channel.name === message.member.voiceChannel.name) inChannel = true;
			}

			if (inChannel) {
				//do nothing
			} else {
				message.member.voiceChannel.join()
				.then(connection => {
					const streamOptions = {seek: 0, volume: volume};
					const stream = ytdl(args[0], {filter: 'audioonly'});
					const dispatcher = connection.playStream(stream, streamOptions);

					//refresh volume
					setInterval(function(){
						dispatcher.setVolume(volume);
					}, 500);
					
					dispatcher.on("end", end => {
						message.member.voiceChannel.leave();
					});
				}).catch(function(error) {
					message.member.voiceChannel.leave();
				});
			}
		}
	}
});

client.login(config.token);