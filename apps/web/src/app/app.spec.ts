import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '@smartsoft001/angular';

import { App } from './app';
import { LoginService } from './auth/login.service';

describe('App', () => {
  const signOut = jest.fn();

  const createApp = async (authenticated: boolean) => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => authenticated },
        },
        { provide: LoginService, useValue: { signOut } },
      ],
    });

    const fixture: ComponentFixture<App> = TestBed.createComponent(App);
    await fixture.whenStable();

    return fixture;
  };

  beforeEach(() => {
    signOut.mockReset();
  });

  it('should render the notes link', async () => {
    const fixture = await createApp(false);

    const link: HTMLAnchorElement =
      fixture.nativeElement.querySelector('.app-header a');
    expect(link.textContent?.trim()).toBe('Notes');
    expect(link.getAttribute('href')).toBe('/notes');
  });

  it('should hide the sign out button when the user is not authenticated', async () => {
    const fixture = await createApp(false);

    expect(
      fixture.nativeElement.querySelector('.app-header__sign-out'),
    ).toBeNull();
  });

  it('should show the sign out button when the user is authenticated', async () => {
    const fixture = await createApp(true);

    expect(
      fixture.nativeElement.querySelector('.app-header__sign-out'),
    ).toBeTruthy();
  });

  it('should sign out and go to the login page on click', async () => {
    const fixture = await createApp(true);
    const navigateByUrl = jest
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);

    fixture.nativeElement.querySelector('.app-header__sign-out').click();
    await fixture.whenStable();

    expect(signOut).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
