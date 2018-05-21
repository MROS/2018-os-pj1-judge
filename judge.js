if (process.argv.length != 3) {
	console.log("用法： node judge.js [目錄名]");
	process.exit(1);
}

const dir_name = process.argv[2];

const fs = require("fs");

const time_case = "TIME.txt";

const test_cases = [
	"FIFO_1.txt",
	"FIFO_2.txt",
	"FIFO_3.txt",
	"RR_1.txt",
	"RR_2.txt",
	"RR_3.txt",
	"SJF_1.txt",
	"SJF_2.txt",
	"SJF_3.txt",
	"PSJF_1.txt",
	"PSJF_2.txt",
	"PSJF_3.txt",
];

function count_slice_time() {
	const time_file = dir_name + "/" + "dmesg_" + time_case;
	const content = fs.readFileSync(time_file).toString().slice(0, -1).split("\n");
	const starts = content.map((c) => parseFloat(c.split(" ")[c.split(" ").length - 2]));
	const ends = content.map((c) => parseFloat(c.split(" ")[c.split(" ").length - 1]));

	const len = starts.length;
	let sum = 0.0;
	for (let i = 0; i < len; i++) {
		sum += (ends[i] - starts[i]);
	}
	return sum / len;
}
const slice_time = count_slice_time();
console.log(slice_time);


function parse(filename) {
	const lines = fs.readFileSync(filename).toString().split("\n");
	const algo = lines[0];
	const n = parseInt(lines[1]);
	const schedule = [];

	for (let p of lines.slice(2, 2 + n)) {
		let sp = p.split(" ");
		schedule.push({ name: sp[0], ready: parseInt(sp[1]), exec: parseInt(sp[2]) });
	}
	console.log(algo);
	console.log(n);
	console.log(schedule);

	return {
		algo: algo,
		schedule: schedule,
	}
}

function rr() {

}

for (let test_case of test_cases) {
	// parse(test_case);
	switch(test_case.split("_")[0]) {
		case "FIFO": {

		}
		case "RR": {

		}
		case "SJF": {

		}
		case "PSJF": {

		}
		
	}
}
