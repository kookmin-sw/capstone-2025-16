CREATE OR REPLACE FUNCTION _to_date AS (a) -> toDate32(a);

CREATE OR REPLACE FUNCTION _get_year AS (a) -> toYear(a);

CREATE OR REPLACE FUNCTION _nullif AS (a, b) -> nullIf(a, b);

CREATE OR REPLACE FUNCTION _ifnull AS (a, b) -> ifNull(a, b);