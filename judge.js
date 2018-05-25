if (process.argv.length != 3 && process.argv.length != 4) {
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
	// "RR_1.txt",
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
console.log(`slice_time: ${slice_time}`);

function parse_input(dir_name, filename) {
	const lines = fs.readFileSync(dir_name + "/" + filename).toString().split("\n");
	const algo = lines[0];
	const n = parseInt(lines[1]);
	const schedule = [];

	for (let p of lines.slice(2, 2 + n)) {
		let sp = p.split(" ");
		schedule.push({ name: sp[0], ready: parseInt(sp[1]), exec: parseInt(sp[2]) });
	}

	return {
		algo: algo,
		schedule: schedule,
	};
}

function parse_output(dir_name, file_name) {
	const dmesg_file = dir_name + "/dmesg_" + file_name;
	const stdout_file = dir_name + "/stdout_" + file_name;
	const stdout_content_lines = fs.readFileSync(stdout_file).toString().split("\n").filter(l => l != "");
	let pid_to_name = {};
	stdout_content_lines.forEach((l) => {
		let [name, pid] = l.split(" ");
		pid_to_name[pid] = name;
	});

	const dmesg_content = fs.readFileSync(dmesg_file).toString().split("\n")
		.filter(l => l != "").map((x) => {
			const s = x.split(" ");
			return s.slice(s.length - 3);
		});
	let ret = {};

	const start_time = Math.min(...dmesg_content.map(x => parseFloat(x[1])));

	for (let p of dmesg_content) {
		const name = pid_to_name[p[0]];
		ret[name] = parseFloat(p[2]) - start_time;
	}
	return ret;
}

function sort_by_value(obj) {
	const a = [];
	for (let key of Object.keys(obj)) {
		a.push({key: key, value: obj[key]});
	}
	return a.sort((x, y) => x.value - y.value).map(x => x.key);
}

// 由於初始時間的規定不清楚，因此僅以結束時間來判定成績
function give_point(standard, student) {
	// 分爲兩項評分
	// 1. 順序是否正確
	let error = false;
	student_order = sort_by_value(student);
	for (let i = 1; i < Object.keys(standard).length; i++) {
		const first = standard[student_order[i - 1]];
		const second = standard[student_order[i]];
		if (first > second) {
			error = true;
			break;
		}
	}
	const order_point = error ? 0 : 100;

	// 2. 時間是否精準
	let latest_end = 0;
	let diff_sum = 0;
	for (let p of Object.keys(standard)) {
		latest_end = latest_end > standard[p] ? latest_end : standard[p];
		diff_sum += Math.abs(standard[p] - student[p]);
	}

	let time_point = 100 * (1 - diff_sum / latest_end);
	time_point = time_point > 0 ? time_point : 0;
	console.log(`順序分：${order_point}, 時間分：${time_point}`);
	return order_point * 0.7 + time_point * 0.3;
}

function fifo(schedule) {
	const ret = {};
	schedule.sort((x, y) => x.ready - y.ready);
	let released_time = 0;
	for (let p of schedule) {
		if (p.ready < released_time) {
			released_time = released_time + p.exec;
		} else {
			released_time = p.ready + p.exec;
		}
		ret[p.name] = released_time / 500 * slice_time;
	}
	return ret;
}

function rr(schedule) {
	const ret = {};
	schedule.sort((x, y) => x.ready - y.ready);
	schedule[0].expect = schedule[0].ready + schedule[0].exec;
	let time = schedule[0].ready;
	let running_process = [schedule[0]];
	let earliest_end = schedule[0];
	for (let i = 1; i < schedule.length || running_process.length > 0;) {
		if (i == schedule.length || earliest_end.expect < schedule[i].ready) {
			ret[earliest_end.name] = earliest_end.expect / 500 * slice_time;
			const rlen = running_process.length;
			running_process.forEach(r => {
				r.exec -= ((earliest_end.expect - time) / rlen);
				r.expect = earliest_end.expect + (r.exec * (rlen - 1)) // 並不準確，但最早結束的是準確的
			});
			running_process = running_process.filter(p => p.name != earliest_end.name);
			time = earliest_end.expect;
			earliest_end = running_process.sort((x, y) => x.expect - y.expect)[0];
		} else {
			const rlen = running_process.length;
			running_process.forEach(r => {
				r.exec -= ((schedule[i].ready - time) / rlen);
				r.expect = schedule[i].ready + (r.exec * (rlen + 1)) // 並不準確，但最早結束的是準確的
			});
			schedule[i].expect = schedule[i].ready + schedule[i].exec * (rlen + 1);
			running_process.push(schedule[i]);
			earliest_end = running_process.sort((x, y) => x.expect - y.expect)[0];
			time = schedule[i].ready;
			i++;
		}
	}
	return ret;
}

function sjf(schedule) {
	const ret = {};
	// 每一回合選一個要執行的
	let time = 0;
	const len = schedule.length;
	for (let i = 0; i < len; i++) {
		let able_to_run = schedule.filter(s => s.ready <= time);
		if (able_to_run.length == 0) {
			time = Math.min(...schedule.map(s => s.ready));
		}
		able_to_run = schedule.filter(s => s.ready <= time);

		let shortest = able_to_run[0];
		able_to_run.forEach((p) => {
			if (shortest.exec > p.exec) {
				shortest = p;
			}
		});
		schedule = schedule.filter(p => p.name != shortest.name);
		time = time + shortest.exec;
		ret[shortest.name] = time / 500 * slice_time;
	}
	return ret;
}

function psjf(schedule) {

	function change_ready_time(schedule, current) {
		schedule.forEach(p => {
			if (p.ready < current) {
				p.ready = current;
			}
		})
	}

	const ret = {};
	let time = Math.min(...schedule.map(p => p.ready));
	let shortest_duration = Math.min(...schedule.filter(p => p.ready == time).map(p => p.exec));
	let running_process = schedule.filter(p => p.ready == time && p.exec == shortest_duration)[0];

	let not_end_process = schedule.length;
	while (schedule.length > 0) {
		let candidate = schedule.filter(p => p.ready + p.exec < time + running_process.exec);
		if (candidate.length == 0) {
			time = time + running_process.exec;
			ret[running_process.name] = time / 500 * slice_time;
			schedule = schedule.filter(p => p.name != running_process.name);

			let earliest = Math.min(...schedule.map(p => p.ready));
			time = earliest > time ? earliest : time;
			change_ready_time(schedule, time);
			let shortest_duration = Math.min(...schedule.filter(p => p.ready == time).map(p => p.exec));
			running_process = schedule.filter(p => p.ready == time && p.exec == shortest_duration)[0];
		} else {
			let selected = candidate.sort((a, b) => {
				if (a.ready == b.ready) {
					return a.exec - b.exec;
				} else {
					return a.ready - b.ready;
				}
			})[0];
			running_process.exec -= (selected.ready - time);
			running_process = selected;
			time = selected.ready;
			change_ready_time(schedule, time);
		}
	}
	return ret;
}

let sum = 0;
for (let test_case of test_cases) {
	const data = parse_input("./data", test_case);
	let standard;
	const student = parse_output(dir_name, test_case);
	// console.log(student);
	switch(data.algo) {
		case "FIFO": {
			standard = fifo(data.schedule);
			break;
		}
		case "RR": {
			standard = rr(data.schedule);
			break;
		}
		case "SJF": {
			standard = sjf(data.schedule);
			break;
		}
		case "PSJF": {
			standard = psjf(data.schedule);
			break;
		}
	}
	const point = give_point(standard, student);
	console.log(`${test_case} 分數： ${point}`);
	sum += point;
}
const avg = sum / test_cases.length;
console.log(`平均分： ${avg}`);
