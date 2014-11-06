/**
 * Created by diego on 11/3/14.
 */
var oracle = require('oracle');

var connectData = {
	hostname: "10.10.0.226",
	port: 1521,
	database: "orcl.orapruebadie.agp.gob.ar", // System ID (SID)
	user: "HR",
	password: "oracle_4U"
}

oracle.connect(connectData, function(err, connection) {
	if (err) { console.log("Error connecting to db:", err); return; }
/*
	connection.execute("SELECT systimestamp FROM dual", [], function(err, results) {
		if (err) { console.log("Error executing query:", err); return; }

		console.log(results);
		connection.close(); // call only when query is finished executing
	});
*/
/*
	connection.execute("select * from hr.diego", [], function (err, results){
		if (err){
			console.log("ERROR", err);
			return;
		}
		console.log(results);
		connection.close();
	});
*/
/*
	connection.setPrefetchRowCount(50);
	var strSql = "SELECT EMPLOYEE_ID,FIRST_NAME, LAST_NAME,EMAIL,PHONE_NUMBER,to_char(HIRE_DATE, 'YYYY-MM-DD') as hire_date,JOB_ID,"+
		"SALARY,"+
		"COMMISSION_PCT,"+
		"MANAGER_ID,"+
		"DEPARTMENT_ID FROM employees where EMPLOYEE_ID = :1";
	var reader = connection.reader(strSql, [181]);

	var result = [];
	function doRead(cb) {
		reader.nextRow(function(err, row) {
			if (err) return cb(err);
			if (row) {
				// do something with row
				//console.log("got " + JSON.stringify(row));
				result.push(row);
				// recurse to read next record
				return doRead(cb)
			} else {
				// we are done
				return cb();
			}
		})
	}

	doRead(function(err) {
		if (err) throw err; // or log it
		console.log(result);
		//connection.close(); // call only when query is finished executing
	});
*/



	var strSql = "SELECT STREET_ADDRESS FROM " +
		" (SELECT STREET_ADDRESS, ROW_NUMBER() OVER (ORDER BY STREET_ADDRESS) R FROM locations) " +
	" WHERE R BETWEEN 5 and 10";
	connection.execute(strSql, [], function(err, results) {
		if (err) { console.log("Error executing query:", err); return; }

		console.log(results);
		connection.close(); // call only when query is finished executing
	});


	/*
		connection.setPrefetchRowCount(50);
		var strSql = "select street_address, postal_code,city, state_province, country_name "+
		" from hr.locations l " +
		" inner join hr.countries c on l.country_id = c.country_id";
		var reader = connection.reader(strSql, []);

		var result = [];
		function doRead(cb) {
			reader.nextRow(function(err, row) {
				if (err) return cb(err);
				if (row) {
					// do something with row
					//console.log("got " + JSON.stringify(row));
					result.push(row);
					// recurse to read next record
					return doRead(cb)
				} else {
					// we are done
					return cb();
				}
			})
		}

		doRead(function(err) {
			if (err) throw err; // or log it
			console.log(result);
			//connection.close(); // call only when query is finished executing
		});
	*/
/*
	function doInsert(stmt, records, cb) {

console.log(records.length);
		if (records.length > 0) {
			var insertRow = records.shift();
			stmt.execute(insertRow, function(err, count) {
				if (err) return cb(err);
				console.log("count%s:", count);
				if (count.updateCount !== 1) return cb(new Error("bad count: " + count));
				// recurse with remaining records
				doInsert(stmt, records, cb);
			});

		} else {
			// we are done
			return cb();
		}
	}

	var users = [[7,'Claudio'], [8,'Claudio'], [9,'Claudio']];


	var statement = connection.prepare("INSERT INTO hr.diego (id, name) VALUES (:1, :2)");
	doInsert(statement, users, function(err) {
		if (err) throw err; // or log it
		console.log("all records inserted");
	});
*/

});



