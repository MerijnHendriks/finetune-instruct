export class PerformanceTimer {
    constructor(connections = 0) {
        // Lazy initialize
        this.startTime = null;
        this.endTime = null;
        this.connections = connections;
    }

    /**
     * Start the timer
     */
    start() {
        this.startTime = performance.now();
    }

    /**
     * Stop the timer
     */
    stop() {
        this.endTime = performance.now();
    }

    /**
     * Show the performance metrics
     */
    showMetrics() {
        const totaltime = parseInt(this.endTime - this.startTime);

        if (this.connections > 0) {
            const timePerTask = parseInt(totaltime / this.connections);
            console.log(`Batch took ${totaltime} ms total, ${timePerTask} ms per task.`);
        } else {
            console.log(`Took ${totaltime} ms total.`);
        }
    }
}