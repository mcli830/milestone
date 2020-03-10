/*
 *  Date-Time functions
 */

// convert duration string (e.g. "10d", "24h", "15m") to millisecond number
const parseDuration = function(duration) {
    // test duration string
    const match = duration.match(/^(\d+)(d|h|m|s|ms)?$/);
    // validate match
    if (match) {
        // get number and unit
        let n = parseInt(match[1], 10);
        const unit = match[2];
        // cascading adder
        switch(unit){
            case 'd':
                n *= 24;
            case 'h':
                n *= 60;
            case 'm':
                n *= 60;
            case 's':
                n *= 1000;
            case 'ms':
            // no unit assumes milliseconds
            default:
                return n;
        }
    }
    // invalid duration string returns null
    return null;
}

module.exports = {
    parseDuration
}