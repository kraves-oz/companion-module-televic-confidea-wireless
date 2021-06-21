var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;

	self.actions();
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
			{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'Televic G3 Conference Microphone control<BR>Uses the IP interface to turn Microphones On/Off<BR>Feedback uses the Camera Interface which must be enabled via web interface.'
		},
		{
			type: 'textinput',
			id: 'prefix',
			label: 'IP of WCAP controller',
			width: 12
		},
		{
			type: 'textinput',
			id: 'UDP_port',
			label: 'UDP Port for feedback (Camera Control interface)',
			width: 12
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destroy");
}

instance.prototype.actions = function(system) {
	var self = this;
	var urlLabel = 'URL';

	if ( self.config.prefix !== undefined ) {
		if ( self.config.prefix.length > 0 ) {
			urlLabel = 'URI';
		}
	}

	self.setActions({
		'get': {
			label: 'GET',
			options: [
				{
					type: 'textinput',
					label: urlLabel,
					id: 'url',
					default: '',
				},
				{
					type: 'textinput',
					label: 'header input(JSON)',
					id: 'header',
					default: '',
				}
			]
		},
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd;

	if ( self.config.prefix !== undefined && action.options.url.substring(0,4) != 'http' ) {
		if ( self.config.prefix.length > 0 ) {
			cmd = self.config.prefix + action.options.url;
		}
		else {
			cmd = action.options.url;
		}
	}
	else {
		cmd = action.options.url;
	}

	if (action.action == 'get') {
		var header;
		if(!!action.options.header) {
			try {
				header = JSON.parse(action.options.header);
			} catch(e){
				self.log('error', 'HTTP POST Request aborted: Malformed JSON header (' + e.message+ ')');
				self.status(self.STATUS_ERROR, e.message);
				return
			}
			self.system.emit('rest_get', cmd, function (err, result) {
				if (err !== null) {
					self.log('error', 'HTTP GET Request failed (' + result.error.code + ')');
					self.status(self.STATUS_ERROR, result.error.code);
				}
				else {
					self.status(self.STATUS_OK);
				}
			}, header);
		} else {
			self.system.emit('rest_get', cmd, function (err, result) {
				if (err !== null) {
					self.log('error', 'HTTP GET Request failed (' + result.error.code + ')');
					self.status(self.STATUS_ERROR, result.error.code);
				}
				else {
					self.status(self.STATUS_OK);
				}
			});
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
