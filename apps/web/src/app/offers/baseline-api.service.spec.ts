import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BaselineApiService } from './baseline-api.service';
import { WorkBaseline, CurveSData, CurrentWorkingEstimate } from '@lt-offers/domain';

describe('BaselineApiService', () => {
  let service: BaselineApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BaselineApiService],
    });
    service = TestBed.inject(BaselineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar a baseline ativa via GET /api/offers/:id/baseline', () => {
    const mockBaseline = { id: 1, offerId: 1, name: 'Data 0' } as WorkBaseline;

    service.getBaseline(1).subscribe((data) => {
      expect(data).toEqual(mockBaseline);
    });

    const req = httpMock.expectOne('/api/offers/1/baseline');
    expect(req.request.method).toBe('GET');
    req.flush(mockBaseline);
  });

  it('deve buscar dados da curva S via GET /api/offers/:id/curve-s', () => {
    const mockCurve = { baselineId: 1, currentSpi: '1.0000' } as CurveSData;

    service.getCurveS(1).subscribe((data) => {
      expect(data).toEqual(mockCurve);
    });

    const req = httpMock.expectOne('/api/offers/1/curve-s');
    expect(req.request.method).toBe('GET');
    req.flush(mockCurve);
  });

  it('deve buscar a estimativa corrente (CWE) via GET /api/offers/:id/cwe', () => {
    const mockCwe = {
      baselineId: 1,
      currentWorkingEstimateValue: '125000000.00',
    } as CurrentWorkingEstimate;

    service.getCurrentWorkingEstimate(1).subscribe((data) => {
      expect(data).toEqual(mockCwe);
    });

    const req = httpMock.expectOne('/api/offers/1/cwe');
    expect(req.request.method).toBe('GET');
    req.flush(mockCwe);
  });
});
