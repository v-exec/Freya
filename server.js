const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
var volume = 1;

client.on('ready', () => {
	client.user.setActivity('Self-sustain mode.');
	console.log("Ready to serve.")
});

client.on('error', console.error);

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
		var greeting = 'Hello, member. My name is Freya. I will be serving you for the time being.\n\nI am not a complex system. I can play music, modify your roles, and I am sentient. Do not ask more of me.';
		var dataIntro = 'My commands are:';
		var data = '_+info_ - I will provide this same information message.\n\n_+play [link]_ - I will join your voicechannel and play the audio you\'ve linked.\n_+volume [0-1]_ - I will set the playback volume.\n_+exit_ - I will leave your voice channel.\n\n_+join [role]_ - I will add a role to your profile.\n_+leave [role]_ - I will remove a role from your profile.';
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
	if (command === 'exit' || command === 'e') {
		if (message.member.voiceChannel) message.member.voiceChannel.leave();
	}

	//add role
	if (command === 'join' || command === 'j') {
		var role = message.guild.roles.find("name", args[0]);

		//check if role exists (disallow admin roles from being joined)
		var roleName;
		if (role != null) roleName = role.toString();
		if (role != null && !roleName.includes('admin') && roleName !== 'Freya') {
			//get member and add role
			var member = message.member;
			member.addRole(role).catch(console.error);
			message.channel.send("Adding role " + role + " to user " + member + ".");
		} else {
			message.channel.send("This role does not exist, or is unavailable given my permissions.");
		}
	}

	//remove role
	if (command === 'leave' || command === 'l') {
		var role = message.guild.roles.find("name", args[0]);

		//check if role exists
		var roleName;
		if (role != null) roleName = role.toString();
		if (role != null && !roleName.includes('admin') && roleName !== 'Freya') {
			//get member and remove role
			var member = message.member;
			member.removeRole(role).catch(console.error);
			message.channel.send("Removing role " + role + " from user " + member + ".");
		} else {
			message.channel.send("This role does not exist, or is unavailable given my permissions.");
		}
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
					setInterval(function() {
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