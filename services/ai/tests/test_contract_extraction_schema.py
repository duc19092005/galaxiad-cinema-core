from routes.contracts import _parse_model_json, _pdf_text
import pytest


@pytest.mark.parametrize('payload', ['{}', '[]', '{"movies": []}', 'not json'])
def test_invalid_model_schema_is_not_reported_as_success(payload):
    result = _parse_model_json(payload)
    assert 'Model không trả về JSON hợp lệ' in result['unresolved']


def test_valid_empty_extraction_remains_empty_without_invented_fields():
    result = _parse_model_json('{"movies": [], "clauses": [], "conflicts": [], "unresolved": []}')
    assert result['movies'] == []
    assert 'distributor' not in result
