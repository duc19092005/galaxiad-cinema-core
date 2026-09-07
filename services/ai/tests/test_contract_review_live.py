"""Opt-in live workflow: real login/API/SQL/MinIO/OCR/Ollama, no mocks.

Creates a clearly marked demo contract and movie, retained for inspection.
Provide CONTRACT_ADMIN_PASSWORD and CONTRACT_MANAGER_PASSWORD; never runs in ordinary CI.
"""
import hashlib
import json
import os
from pathlib import Path
import time
import uuid
from contextlib import contextmanager

import httpx
import pytest

pytestmark = pytest.mark.skipif(os.getenv('CONTRACT_LIVE_TEST') != '1', reason='Explicit live contract test only')


@contextmanager
def login(email, password):
    client = httpx.Client(base_url=os.getenv('API_BASE_URL', 'http://api:8080'), timeout=60)
    response = client.post('/api/v1/IdentityAccess/regular-login', json={'email': email, 'password': password})
    assert response.status_code == 200, f'Login failed: {response.status_code}'
    token = next((cookie.value for cookie in client.cookies.jar if cookie.name == 'X-Access-Token'), None)
    assert token, 'Login must return a real access token'
    client.headers['Authorization'] = f'Bearer {token}'
    try:
        yield client
    finally:
        client.close()


def data(response):
    assert response.is_success, f'{response.request.method} {response.request.url.path}: {response.status_code} {response.text[:600]}'
    return response.json().get('data')


def test_admin_upload_manager_review_sign_activate_preserves_unicode():
    with login('admin@cinema.com', os.environ['CONTRACT_ADMIN_PASSWORD']) as admin, login('movie.manager@cinema.com', os.environ['CONTRACT_MANAGER_PASSWORD']) as manager:
        reviewers = data(admin.get('/api/contracts/reviewers'))
        manager_id = next(r['userId'] for r in reviewers if 'phim' in r['name'].lower())
        run = uuid.uuid4().hex[:10]
        contract = data(admin.post('/api/contracts', json={'counterpartyContractNumber': f'TEST-REVIEW-{run}', 'isDemo': True}))
        url = f"/api/contracts/{contract['id']}"
        source = Path(os.environ.get('CONTRACT_SAMPLE_PDF', '/workspace/sample-contracts/hop_dong_chieu_phim_dune_2.pdf')).read_bytes()
        data(admin.post(url + '/documents', files={'file': ('sample.pdf', source, 'application/pdf')}))
        data(admin.post(url + '/extractions'))
        deadline = time.monotonic() + 300
        while time.monotonic() < deadline:
            detail = data(admin.get(url))
            if detail['processingStatus'] not in ('Queued', 'Processing'):
                break
            time.sleep(2)
        assert detail['processingStatus'] == 'AwaitingDataApproval', detail['processingStatus']
        extraction = json.loads(detail['revision']['extractionJson'])
        assert extraction['modelProvider'] == 'ollama'
        assert extraction['modelUsed'] == 'qwen3.5:4b'
        assert extraction['modelAnalysisSucceeded'] is True
        movie = extraction['analysis']['movies'][0]
        assert movie['vietnameseTitle'] == 'DUNE: HÀNH TINH CÁT - PHẦN HAI'
        assert 'Phần Hai tiếp tục' in movie['description']
        assert movie['posterUrl'].startswith('https://image.tmdb.org/')
        assert 'Galaxiad Pictures' in detail['distributorName']
        document = detail['revision']['documents'][0]
        download = admin.get(url + '/documents/' + document['contractDocumentId'])
        assert hashlib.sha256(download.content).hexdigest() == document['sha256']
        assert download.content == source
        assert manager.get(url).status_code == 404
        data(admin.post(url + '/assign', json={'movieManagerId': manager_id}))
        assert manager.get(url).status_code == 200
        assert manager.post(url + '/approve').status_code == 403
        assert manager.post(url + '/assign', json={'movieManagerId': manager_id}).status_code == 403
        assert manager.post('/api/movieManager/movies', json={}).status_code == 410
        ages = data(admin.get('/api/v1/Public/MovieRequiredAge'))
        age = next(x['movieRequiredAgeSymbolId'] for x in ages if x['movieRequiredAgeSymbol'] == 'T18')
        formats = data(admin.get('/api/v1/Public/MovieFormats'))
        line = {
            'vietnameseTitle': f"{movie['vietnameseTitle']} [TEST {run}]", 'englishTitle': movie['englishTitle'],
            'description': movie['description'] + f' [TEST {run}]', 'posterUrl': movie['posterUrl'],
            'director': movie['director'], 'actors': ', '.join(movie['actors']) if isinstance(movie['actors'], list) else movie['actors'],
            'durationMinutes': movie['durationMinutes'], 'movieRequiredAgeId': age,
            'licenseStartAt': '2026-10-01T00:00:00Z', 'licenseEndAt': '2026-12-01T00:00:00Z',
            # Explicit manual reviewer decisions, not assertions that AI got these fields right.
            'cinemaScopeState': 'NoAdditionalRestrictionConfirmed', 'cinemaIds': [],
            'formatScopeState': 'Specified', 'formatIds': [f['formatId'] for f in formats if f['formatName'] in ('2D', '3D', 'IMAX')],
            'cinemaSharePercent': 50, 'distributorSharePercent': 50,
            'revenueBasis': 'TICKET_FINAL_PRICE_AFTER_REFUND', 'settlementCycle': 'Monthly', 'reviewed': True,
        }
        body = {'movieLines': [line], 'financialPolicyReviewed': True, 'distributorName': detail['distributorName']}
        data(manager.put(url + '/extraction-review', json=body))
        line['description'] += ' Đã đối soát thủ công.'
        data(manager.put(url + '/extraction-review', json=body))
        reviewed = data(manager.get(url))
        history = json.loads(reviewed['revision']['reviewHistoryJson'])
        event = history['events'][-1]
        assert event['before']['movieLines'][0]['description'] != event['after']['movieLines'][0]['description']
        assert reviewed['revision']['movieLines'][0]['movieId'] is None
        data(manager.post(url + '/submit'))
        assert manager.put(url + '/extraction-review', json=body).status_code == 409
        data(admin.post(url + '/approve'))
        data(admin.post(url + '/sign', json={'password': os.environ['CONTRACT_ADMIN_PASSWORD']}))
        data(admin.post(url + '/activate'))
        activated = data(admin.get(url))
        assert activated['status'] == 'Activated'
        movie_id = activated['revision']['movieLines'][0]['movieId']
        assert movie_id
        saved = data(admin.get('/api/movieManager/movies/' + movie_id))
        assert line['description'] in json.dumps(saved, ensure_ascii=False), saved
        assert data(admin.post(url + '/activate'))['alreadyApplied'] is True
        print(f"Live workflow passed: {contract['internalCode']} / {movie_id}")
