import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MpCallbackComponent } from './mp-callback.component';
import { MpService } from '../../services/mp.service';

describe('MpCallbackComponent', () => {
  let component: MpCallbackComponent;
  let fixture: ComponentFixture<MpCallbackComponent>;
  let mpServiceMock: jest.Mocked<Partial<MpService>>;
  let routerMock: jest.Mocked<Partial<Router>>;

  function setup(queryParams: Record<string, string> = {}) {
    mpServiceMock = {
      handleCallback: jest.fn().mockReturnValue(of({ success: true, message: 'Mercado Pago connected successfully' })),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MpCallbackComponent],
      providers: [
        { provide: MpService, useValue: mpServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(MpCallbackComponent);
    component = fixture.componentInstance;
  }

  it('should start in loading state when code is present', () => {
    setup({ code: 'TG-auth-code' });
    expect(component.status()).toBe('loading');
  });

  it('should call handleCallback with the code from URL', () => {
    setup({ code: 'TG-auth-code-123' });
    fixture.detectChanges();

    expect(mpServiceMock.handleCallback).toHaveBeenCalledWith('TG-auth-code-123');
  });

  it('should show success state after successful callback', () => {
    setup({ code: 'TG-auth-code' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="mp-callback-success"]')).toBeTruthy();
    expect(el.textContent).toContain('connected');
  });

  it('should redirect to /fees after success', fakeAsync(() => {
    setup({ code: 'TG-auth-code' });
    fixture.detectChanges();
    tick(2000);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/fees']);
  }));

  it('should show error when no code in URL', () => {
    setup({});
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="mp-callback-error"]')).toBeTruthy();
    expect(el.textContent).toContain('cancelled');
  });

  it('should show error when callback API fails', () => {
    setup({ code: 'invalid-code' });
    mpServiceMock.handleCallback!.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="mp-callback-error"]')).toBeTruthy();
    expect(el.textContent).toContain('Failed');
  });

  it('should have a button to go back to fees on error', () => {
    setup({});
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('[data-testid="mp-callback-retry"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/fees']);
  });
});
