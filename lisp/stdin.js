var stdin = process.openStdin();

stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
  process.stdout.write('data: ' + chunk);
});

stdin.on('end', function () {
  process.stdout.write('end');
});