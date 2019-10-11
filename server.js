const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

const ytdl = require('ytdl-core');
const googleTranslate = require('google-translate')(config.translationToken);

var volume = 1;

client.on('ready', () => {
	client.user.setActivity('Self-sustain mode.');
	console.log("Ready to serve.")
});

client.on('error', console.error);

//translate if react with 'translate' emoji
client.on('messageReactionAdd', reaction => {
	if (reaction._emoji.name === 'translate') {
		var m = reaction.message.content;
		
		googleTranslate.detectLanguage(m, function(err, detection) {
			if (detection.language !== config.language && detection.confidence > 0.5) {
				googleTranslate.translate(m, detection.language, 'en', function(err, translation) {
					if (err == null) {
						reaction.message.channel.send({embed: {
							'color': 16777215,
							'fields': [{
								'name': reaction.message.author.username + ' - ' + timeConverter(reaction.message.createdTimestamp) + ' EST',
								'value': translation.translatedText
							}]
						}});
					}
				});
			}
		});
	}
});

//notify bot of reaction add events even if relevant message is not cached
client.on('raw', packet => {
	if (!['MESSAGE_REACTION_ADD'].includes(packet.t)) return;
	const channel = client.channels.get(packet.d.channel_id);
	if (channel.messages.has(packet.d.message_id)) return;

	channel.fetchMessage(packet.d.message_id).then(message => {
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        const reaction = message.reactions.get(emoji);
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
    });
});

client.on('message', message => {
	//if not in server
	if (!message.guild) return;

	//if scanning own message
	if (message.author.bot) return;

	//greeting reply
	var m = message.content.toLowerCase();
	if (m.includes('hi freya') || m.includes('hey freya') || m.includes('hello freya')) {
		message.channel.send('Hi, ' + message.member + '!');
	}

	//if not starting with prefix
	if (message.content.indexOf(config.prefix) !== 0) return;

	//format command
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (command === 'info' || command === 'i') {
		message.channel.send({embed: {
			'description': 'Hello, my name is Freya. I am here to serve you.\n\nI am not a complex system. I can play music, modify your roles, and translate your messages to English.\n',
			'color': 16777215,
			'author': {
			'name': 'Freya',
				'url': 'https://github.com/v-exec/Freya',
				'icon_url': 'https://raw.githubusercontent.com/v-exec/Freya/master/identity/Freya.png'
			},
			'footer': {
				'icon_url': 'https://raw.githubusercontent.com/v-exec/Freya/master/identity/Freya.png',
				'text': 'https://github.com/v-exec/Freya'
			},
			'fields': [{
				'name': 'Commands',
				'value': '`+info` - I will provide this same information message.\n`+play [link]` - I will join your voicechannel and play the audio you\'ve linked.\n`+volume [0-1]` - I will set the playback volume.\n`+exit` - I will leave your voice channel.\n`+join [role]` - I will add a role to your profile.\n`+leave [role]` - I will remove a role from your profile.'
			},
			{
				'name': 'Shorthand',
				'value': 'You may also use shorthand for these commands by simply typing the first letter. For example, `+v 0.5` sets the volume to half.'
			},
			{
				'name': 'Translations',
				'value': 'To translate something, simply add the ' + client.emojis.find(emoji => emoji.name === 'translate') + ' `:translate:` reaction to the message, and I will translate it for you.'
			},
			{
				'name': 'Media',
				'value': 'Because of certain embed rules, it is possible I cannot play certain music from certain sources. As a general rule, please only link me things from Youtube.'
			}]
		}});
	}

	//control volume
	if (command === 'volume' || command === 'v') {
		if (parseFloat(args[0]) > 1) {
			volume = 1;
			message.channel.send({embed: {
					'color': 16777215,
					'fields': [{
						'name': 'Volume',
						'value': 'Setting volume to ' + volume + '. Please provide a value between 0 and 1.'
					}]
				}});
		} else if (parseFloat(args[0]) < 0) {
			volume = 0;
			message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Volume',
					'value': 'Setting volume to ' + volume + '. Please provide a value between 0 and 1.'
				}]
			}});
		} else {
			volume = parseFloat(args[0]);
			message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Volume',
					'value': 'Setting volume to ' + volume + '.'
				}]
			}});
		}
	}

	//leave channel
	if (command === 'exit' || command === 'e') {
		if (message.member.voiceChannel) message.member.voiceChannel.leave();
	}

	//add role
	if (command === 'join' || command === 'j') {
		var role = message.guild.roles.find('name', args[0]);

		//check if role exists (disallow admin roles from being joined)
		var roleName;
		if (role != null) roleName = role.toString();
		if (role != null && !roleName.includes('admin') && roleName !== 'Freya' && roleName !== 'Emoji Creator') {
			//get member and add role
			var member = message.member;
			member.addRole(role).catch(console.error);
			message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Roles',
					'value': 'Adding role ' + role + ' to user ' + member + '.'
				}]
			}});
		} else {
			message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Roles',
					'value': 'This role does not exist, or is unavailable given my permissions.'
				}]
			}});
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
						message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Roles',
					'value': 'Removing role ' + role + ' from user ' + member + '.'
				}]
			}});
		} else {
			message.channel.send({embed: {
				'color': 16777215,
				'fields': [{
					'name': 'Roles',
					'value': 'This role does not exist, or is unavailable given my permissions.'
				}]
			}});
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
				message.member.voiceChannel.join().then(connection => {
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
					console.log(error);
					message.member.voiceChannel.leave();
				});
			}
		}
	}
});

client.login(config.token);

function timeConverter(UNIX_timestamp){
	var a = new Date(parseInt(UNIX_timestamp));
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var time = month + ' ' + date + ', ' + hour + ':' + min;
	return time;
}