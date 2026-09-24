import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login.page';
import { LoginService } from './login.service';

describe('LoginPage', () => {
  const username = 'admin@example.com';
  const password = 'placeholder-password';
  const signIn = jest.fn();

  let fixture: ComponentFixture<LoginPage>;
  let navigateByUrl: jest.SpyInstance;

  const submitCredentials = async () => {
    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '#smart-sign-in-form-email',
    );
    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '#smart-sign-in-form-password',
    );

    emailInput.value = username;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    signIn.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: { signIn } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    navigateByUrl = jest
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should render the sign-in form', () => {
    const submitButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button.submit');

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Sign in',
    );
    expect(submitButton.textContent?.trim()).toBe('Sign in');
  });

  it('should navigate to the notes page after a successful sign in', async () => {
    signIn.mockResolvedValue(undefined);

    await submitCredentials();

    expect(signIn).toHaveBeenCalledWith(username, password);
    expect(navigateByUrl).toHaveBeenCalledWith('/notes');
  });

  it('should render an alert when the sign in fails', async () => {
    signIn.mockRejectedValue(new Error('Invalid username or password'));

    await submitCredentials();

    const alert: HTMLElement =
      fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent?.trim()).toBe('Invalid username or password');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
