if (process.argv.length != 4) {
	console.log("用法： node generate.js [執行檔名稱] [輸出目錄名]");
	process.exit(1);
}

const fs = require("fs");
const child_process = require("child_process");

const test_cases = [
	"TIME.txt",
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

for (let test_case of test_cases) {
	const f = fs.readFileSync("./data/" + test_case).toString();
	const n = parseInt(f.split("\n")[1]);
	console.log(test_case);
	const stdout = child_process.execSync(`./${process.argv[2]} < ${"./data/" + test_case}`);
	fs.writeFileSync(`./${process.argv[3]}/stdout_${test_case}`, stdout);
	const dmesg = child_process.execSync(`dmesg | grep "Project" | tail -${n}`);
	fs.writeFileSync(`${process.argv[3]}/dmesg_${test_case}`, dmesg);
}
