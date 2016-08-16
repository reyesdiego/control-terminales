/**
 * Created by diego on 6/10/15.
 */

var oracledb = require('oracledb');
oracledb.maxRows = 103;
//oracledb.outFormat = 2;
oracledb.getConnection(
    {
        user          : "afip",
        password      : "afip_",
        connectString : "(DESCRIPTION = " +
                                    "(ADDRESS = (PROTOCOL = TCP)(HOST = 10.1.0.60)(PORT = 1521)) " +
                                    "(CONNECT_DATA = " +
                                    "        (SID = AFIP) " +
                                    ") " +
                        ")"
    },
    function(err, connection)
    {
        if (err) {
            console.error(err.message);
            return;
        }



        let strSql = `
                    insert into temp
                    select INVOICE_HEADER.NRO_COMPROB
                    FROM INVOICE_HEADER
                    WHERE TERMINAL = 'TERMINAL4' AND
                    NRO_PTO_VENTA = 5 AND
                    COD_TIPO_COMPROB = 1`;
        let strSql1 = `
                    select sta, sto, (sto - sta)+1 as res
                    from (
                        select m.tempid + 1 as sta,
                        (select min(x.tempid) - 1 from temp x where x.tempid > m.tempid) sto
                    from temp m
                    left outer join temp r on m.tempid = r.tempid - 1
                    where r.tempid is null )
                    where sto is not null
                    order by sta`;

        connection.execute(
            strSql,
            [],
            {},
            function(err, result)
            {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                } else {

                    connection.execute(
                        strSql1,
                        [],
                        {},
                        function(err, result) {
                            if (err) {
                                console.error(err.message);
                                doRelease(connection);
                            } else {
                                console.log("metadata: %j", result);
                                //console.log("rows: %s, count: %j ", result.rows.length, result.rows);
                                doRelease(connection);
                            }
                        });
                }
            });
    });

function doRelease(connection)
{
    connection.release(
        function(err) {
            if (err) {
                console.error(err.message);
            }
        });
}