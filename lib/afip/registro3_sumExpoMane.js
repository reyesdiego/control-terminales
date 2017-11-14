/**
 * Created by diego on 14/08/17.
 */
"use strict";

class Registro3SumExpoMane {
    constructor (connection) {
        this.cn = connection;
    }

    getBySumaria(sumaria) {
        return new Promise((resolve, reject) => {
            this.cn.pool.getConnection((err, connection) => {
                var strSql = "";
                if (err) {
                    console.log(err, "Error acquiring from pool.");
                    reject({ status: "ERROR", message: err.message, data: err });
                } else {
                    strSql = `SELECT R3.ID,
                                TIPOREGISTRO,
                                SUMARIA,
                                CONOCIMIENTO,
                                NRO_LINEA,
                                COD_EMBALAJE,
                                TIPO_EMBALAJE,
                                E.DESCRIPTION DESC_EMBALAJE,
                                PESO,
                                TIPO_MERCADERIA,
                                NUMERACIONBULTOS,
                                CANTIDAD_PARCIAL,
                                CANTIDAD_TOTAL,
                                CANTIDAD_SOBRANTE_FALTANTE,
                                CANTIDADAFECTAR,
                                COMENTARIOS,
                                REGISTRADO_POR,
                                REGISTRADO_EN,
                                PTOEMBARQUE,
                                POS_SIM,
                                RESPTRASTRAB
                              FROM REGISTRO3_SUMEXPOMANE R3
                                    LEFT JOIN EMBALAJE E ON R3.COD_EMBALAJE = E.ID
                              WHERE SUMARIA = :1`;

                    connection.execute(strSql, [sumaria], (err, data) => {
                        var result;

                        this.cn.doRelease(connection);
                        if (err) {
                            reject({ status: "ERROR", message: err.message, data: err });
                        } else {
                            result = data.rows.map(item => ({
                                conocimiento: item.CONOCIMIENTO,
                                sumaria: item.SUMARIA,
                                peso: item.PESO,
                                cod_embalaje: item.COD_EMBALAJE,
                                desc_embalaje: item.DESC_EMBALAJE,
                                tipo_mercaderia: item.TIPO_MERCADERIA,
                                cantidad_total: item.CANTIDAD_TOTAL
                            }));

                            result = {status: "OK", totalCount : result.length, data : result};
                            resolve(result);
                        }
                    });
                }
            });
        });
    }

}


module.exports = Registro3SumExpoMane;