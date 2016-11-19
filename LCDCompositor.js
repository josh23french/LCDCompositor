var SerialPort = require('serialport');
var port = new SerialPort('/dev/cu.usbserial', {
  baudRate: 9600
});

function Framebuffer(segments) {
	this.segments = segments || [];
}
Framebuffer.prototype.addSegment = function(segment){
	this.segments.push(segment);
};
Framebuffer.prototype.insertSegment = function(segment, position){
	position = position || 0;
	this.segments.splice(position, 0, segment);
};
Framebuffer.prototype.tick = function(){
	// Time passes...
};
Framebuffer.prototype.compile = function(){
	// Go through all segments and have them send you their compiled ouput.

	var line = '';
	for (var segment in this.segments) {
		line += this.segments[segment].compile();
	}
	return line;
};

function Segment(value, width, autoscroll) {
	this.value = value;
	this.width = width || value.length;
	this.autoscroll = autoscroll || true;
	this.start = -1;
	this.reachedEndTime = false;
	this.reachedEndWait = 2000; // default end wait (millis)
}

Segment.prototype.compile = function(){
	if( !this.autoscroll || this.width >= this.value.length) return this.value.substring(0, this.width);
	var time = new Date().getTime();
	var newstart = this.start + 1;
	//console.log(this.start, newstart);
	//this.start = ((this.start + this.width) >= this.value.length) ? this.start : this.start + 1;
	if( this.reachedEndTime && ((this.reachedEndTime + this.reachedEndWait) < time) ) {
		// we're done waiting at the end... time to reset to the beginning!
		console.log("Done waiting at end! Resetting...");
		newstart = 0;
		this.reachedEndTime = false;
		this.startedTime = time;
	}
	if( this.start == this.value.length-this.width ) {
		console.log("Reached end of string!");
	}
	// limit output to width. If autoscroll is false, truncate.
	// If autoscroll is true, get current scroll output based on ticks.
	// 1. Display trunc'd value for x time.
	// 2. Scroll until hitting end.
	// 3. Pause at end for y time.
	// 4. Goto 1.
	return this.value.toString().substring(newstart, newstart + this.width);
};

port.on('open', function() {
  port.write(String.fromCharCode(0xFE14));
  console.log("opened port");
  var tim = new Date().getTime();
  var seg1 = new Segment(tim, 10);
  var seg2 = new Segment("   ", 3);
  var seg3 = new Segment("Off", 3);
  var fb1 = new Framebuffer([seg1, seg2, seg3]);
  var fb2 = new Framebuffer([seg3, seg2, seg1]);
  var run = true;
  //var output = process.stdout;
  var output = port;
  var int = setInterval(function(){
  	seg1.value = new Date().getTime();
  	//output.write('\x1Bc'); // only for stdout
  	//output.write( fb1.compile());
  	//output.write('\n'); // only for stdout
  	//output.write( fb2.compile());
}, 2000);
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})
