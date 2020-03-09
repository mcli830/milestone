import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { HttpResponse } from "@angular/common/http";
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      name: '',
      email: '',
      password: '',
    });
  }

  onSubmit(userData: User): void {
    console.log(userData);
    this.authService.register(userData).subscribe((res: HttpResponse<any>) => {
      this.router.navigate(['/']);
    });
  }

}
