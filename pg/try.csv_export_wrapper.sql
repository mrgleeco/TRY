
---- General framework for exporting date series queries as file(s)
DROP FUNCTION tryit();
CREATE FUNCTION tryit() RETURNS varchar[] AS $$
--CREATE FUNCTION apps_monthly_report_csv() RETURNS varchar[] AS $$
DECLARE
    d1      DATE;
    d2      DATE;
    ym      VARCHAR;
    tmpfile VARCHAR[];
    op      VARCHAR[];
    exec    VARCHAR[];
    x       VARCHAR;

BEGIN
    d1  := date_trunc('month', current_date - interval '1 month');
    d2  := date_trunc('month',current_date);

    ym  := extract(year from d1) || '-' || to_char(to_timestamp( extract(month from d1)::text, 'MM'), 'TMmon');

    f[0] := '/tmp/appsA-' || ym  || '.csv';
    f[1] := '/tmp/appsB-' || ym  || '.csv';
    -- NB: assignment like this fails to do lookups
    -- f := ARRAY[ 'foo', 'bar' ];

    op[0] := 'SELECT user_id,user_email,zone_id,zone_name,cdate FROM cfv_np_zone WHERE zone_status = ' || quote_literal('V') '' \'V\' '
    exec[0] := 'COPY( ' || func[0] || ') TO \'' f[0] || '\' CSV HEADER; ';


    EXECUTE exec[0];

    return f;

END;
$$ LANGUAGE plpgsql;

