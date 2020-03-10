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
  }

  // use getter to access authService's user variable
  get user(): User {
    return this.authService.user;
  }

  onLogout(): void {
    this.authService.logout().subscribe((res: HttpResponse<any>) => {
        console.log(res.status);
        this.router.navigate(['/']);
    });
  }

}
