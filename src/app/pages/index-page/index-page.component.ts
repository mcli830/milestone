import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user.model';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-index-page',
  templateUrl: './index-page.component.html',
  styleUrls: ['./index-page.component.css']
})
export class IndexPageComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    // on page visit, check if user object exists in auth service
    if (!this.user) {
      // if no user data, request access token and user data
      // this should happen when user is logged in, but revisiting/refreshing the page
      this.authService.getAccessToken().subscribe((res: HttpResponse<any>) => {
        console.log('resonse: ', res);
      });
    }
  }

  // use getter to access authService's user variable
  get user(): User {
    return this.authService.user;
  }

  onLogout(): void {
    this.authService.logout().subscribe((res: HttpResponse<any>) => {
        this.router.navigate(['/']);
    });
  }

}
