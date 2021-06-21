var udp           = require('../../udp');
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

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	self.config = config;

//	if (self.config.prot == 'udp') { 	// set if UDP port has been entered
//		self.init_udp();
//	};
	self.init_udp();

	self.actions();
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;

	if (self.config.prot == 'udp') {
		self.init_udp();
	};
}

// Init UDP
instance.prototype.init_udp = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, self.config.port);

		self.udp.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		// If we get data, thing should be good
		self.udp.on('data', function () {
			self.status(self.STATE_OK);
		});

		self.udp.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

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
			id: 'host',
			label: 'IP of WCAP controller',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'UDP_port',
			label: 'UDP Port for feedback (from Camera Control interface)',
			default: '8000',
			width: 12
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
	}

	debug("destroy");
}

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];

	self.setPresetDefinitions(presets);
}

instance.prototype.actions = function(system) {
	var self = this;
	var urlLabel = 'URL';

	if ( self.config.host !== undefined ) {
		if ( self.config.host.length > 0 ) {
			urlLabel = 'URI';
		}
	}

	self.setActions({			// ====== UPDATE ACTIONS ===========
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

	if ( self.config.host !== undefined && action.options.url.substring(0,4) != 'http' ) {
		if ( self.config.host.length > 0 ) {
			cmd = 'http://' + self.config.host + action.options.url;
		}
		else {
			cmd = action.options.url;
		}
	}
	else {
		cmd = action.options.url;
	}

	switch(action.action) {

		case 'get': {
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
		break;
		}	

		case 'get': {
		
		break;
		}			
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
